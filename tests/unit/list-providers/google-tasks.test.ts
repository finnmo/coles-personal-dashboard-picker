// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GoogleTasksProvider } from '@/lib/list-providers/google-tasks'
import { getListProvider } from '@/lib/list-providers'

// Mock the googleapis module to avoid real OAuth2 calls
vi.mock('googleapis', () => {
  const mockInsert = vi.fn()
  const mockList = vi.fn()
  const mockPatch = vi.fn()
  const mockClear = vi.fn()

  return {
    google: {
      auth: {
        OAuth2: vi.fn().mockImplementation(() => ({
          setCredentials: vi.fn(),
        })),
      },
      tasks: vi.fn().mockReturnValue({
        tasks: { insert: mockInsert, list: mockList, patch: mockPatch, clear: mockClear },
        tasklists: { list: vi.fn() },
      }),
    },
    __mockInsert: mockInsert,
    __mockList: mockList,
    __mockPatch: mockPatch,
    __mockClear: mockClear,
  }
})

async function getMocks() {
  const mod = await import('googleapis')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = mod as any
  return {
    insert: m.__mockInsert as ReturnType<typeof vi.fn>,
    list: m.__mockList as ReturnType<typeof vi.fn>,
    patch: m.__mockPatch as ReturnType<typeof vi.fn>,
    clear: m.__mockClear as ReturnType<typeof vi.fn>,
  }
}

const CREDS = {
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  refreshToken: 'test-refresh-token',
  taskListId: 'test-list-id',
}

function makeProvider() {
  return new GoogleTasksProvider(
    CREDS.clientId,
    CREDS.clientSecret,
    CREDS.refreshToken,
    CREDS.taskListId
  )
}

describe('GoogleTasksProvider', () => {
  beforeEach(async () => {
    const { insert, list, patch, clear } = await getMocks()
    insert.mockResolvedValue({ data: { id: 'task-123', title: 'Milk' } })
    list.mockResolvedValue({
      data: {
        items: [
          { id: 'task-1', title: 'Milk', status: 'needsAction' },
          { id: 'task-2', title: 'Eggs', status: 'needsAction' },
        ],
      },
    })
    patch.mockResolvedValue({ data: {} })
    clear.mockResolvedValue({})
  })

  it('has name "google_tasks"', () => {
    expect(makeProvider().name).toBe('google_tasks')
  })

  describe('add()', () => {
    it('returns ok=true on successful task creation', async () => {
      const result = await makeProvider().add({ productName: 'Milk' })
      expect(result.ok).toBe(true)
    })

    it('returns the taskId from the created task', async () => {
      const result = await makeProvider().add({ productName: 'Milk' })
      expect(result.taskId).toBe('task-123')
    })

    it('inserts a task with product name as title', async () => {
      const { insert } = await getMocks()
      await makeProvider().add({ productName: 'Greek Yogurt' })
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          tasklist: CREDS.taskListId,
          requestBody: expect.objectContaining({ title: 'Greek Yogurt' }),
        })
      )
    })
  })

  describe('list()', () => {
    it('returns incomplete tasks as ListItem array', async () => {
      const items = await makeProvider().list()
      expect(items).toHaveLength(2)
      expect(items[0]).toEqual({ taskId: 'task-1', title: 'Milk' })
    })

    it('filters out completed tasks', async () => {
      const { list } = await getMocks()
      list.mockResolvedValue({
        data: {
          items: [
            { id: 'task-1', title: 'Milk', status: 'completed' },
            { id: 'task-2', title: 'Eggs', status: 'needsAction' },
          ],
        },
      })
      const items = await makeProvider().list()
      expect(items).toHaveLength(1)
      expect(items[0].title).toBe('Eggs')
    })
  })

  describe('complete()', () => {
    it('patches the task status to completed', async () => {
      const { patch } = await getMocks()
      await makeProvider().complete('task-abc')
      expect(patch).toHaveBeenCalledWith(
        expect.objectContaining({
          tasklist: CREDS.taskListId,
          task: 'task-abc',
          requestBody: { status: 'completed' },
        })
      )
    })
  })
})

describe('getListProvider — google_tasks', () => {
  beforeEach(() => {
    process.env.LIST_PROVIDER = 'google_tasks'
    process.env.GOOGLE_CLIENT_ID = 'client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret'
    process.env.GOOGLE_REFRESH_TOKEN = 'refresh-token'
    process.env.GOOGLE_TASK_LIST_ID = 'list-id'
    delete process.env.APPLE_SHORTCUTS_NAME
  })

  it('returns a GoogleTasksProvider instance', () => {
    const provider = getListProvider()
    expect(provider).toBeInstanceOf(GoogleTasksProvider)
    expect(provider.name).toBe('google_tasks')
  })

  it('throws when Google vars are missing', () => {
    delete process.env.GOOGLE_CLIENT_ID
    expect(() => getListProvider()).toThrow(/GOOGLE_CLIENT_ID/)
  })
})

describe('getListProvider — not configured', () => {
  beforeEach(() => {
    delete process.env.LIST_PROVIDER
  })

  it('throws when LIST_PROVIDER is not set', () => {
    expect(() => getListProvider()).toThrow(/LIST_PROVIDER/)
  })
})
