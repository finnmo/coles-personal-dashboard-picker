// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GoogleTasksProvider } from '@/lib/list-providers/google-tasks'
import { getListProvider } from '@/lib/list-providers'

// Mock the googleapis module to avoid real OAuth2 calls
vi.mock('googleapis', () => {
  const mockInsert = vi.fn()
  const mockTasksList = vi.fn()

  return {
    google: {
      auth: {
        OAuth2: vi.fn().mockImplementation(() => ({
          setCredentials: vi.fn(),
        })),
      },
      tasks: vi.fn().mockReturnValue({
        tasks: { insert: mockInsert },
        tasklists: { list: mockTasksList },
      }),
    },
    __mockInsert: mockInsert,
    __mockTasksList: mockTasksList,
  }
})

async function getMocks() {
  const mod = await import('googleapis')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = mod as any
  return { insert: m.__mockInsert as ReturnType<typeof vi.fn> }
}

describe('GoogleTasksProvider', () => {
  const CREDS = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    refreshToken: 'test-refresh-token',
    taskListId: 'test-list-id',
  }

  beforeEach(async () => {
    const { insert } = await getMocks()
    insert.mockResolvedValue({ data: { id: 'task-123', title: 'Milk (COLES)' } })
  })

  it('has name "google_tasks"', () => {
    const provider = new GoogleTasksProvider(
      CREDS.clientId,
      CREDS.clientSecret,
      CREDS.refreshToken,
      CREDS.taskListId
    )
    expect(provider.name).toBe('google_tasks')
  })

  it('returns ok=true on successful task creation', async () => {
    const provider = new GoogleTasksProvider(
      CREDS.clientId,
      CREDS.clientSecret,
      CREDS.refreshToken,
      CREDS.taskListId
    )
    const result = await provider.add({ productName: 'Milk', store: 'COLES' })
    expect(result.ok).toBe(true)
  })

  it('does not return a redirectUrl (server-side)', async () => {
    const provider = new GoogleTasksProvider(
      CREDS.clientId,
      CREDS.clientSecret,
      CREDS.refreshToken,
      CREDS.taskListId
    )
    const result = await provider.add({ productName: 'Milk', store: 'COLES' })
    expect(result.redirectUrl).toBeUndefined()
  })

  it('inserts a task with product name and store in title', async () => {
    const { insert } = await getMocks()
    const provider = new GoogleTasksProvider(
      CREDS.clientId,
      CREDS.clientSecret,
      CREDS.refreshToken,
      CREDS.taskListId
    )
    await provider.add({ productName: 'Greek Yogurt', store: 'IGA' })
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        tasklist: CREDS.taskListId,
        requestBody: expect.objectContaining({ title: 'Greek Yogurt (IGA)' }),
      })
    )
  })

  it('uses the correct task list ID', async () => {
    const { insert } = await getMocks()
    const provider = new GoogleTasksProvider(
      CREDS.clientId,
      CREDS.clientSecret,
      CREDS.refreshToken,
      'my-custom-list-id'
    )
    await provider.add({ productName: 'Bread', store: 'COLES' })
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ tasklist: 'my-custom-list-id' }))
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

describe('getListProvider — google_keep (fallback)', () => {
  beforeEach(() => {
    process.env.LIST_PROVIDER = 'google_keep'
    process.env.GOOGLE_CLIENT_ID = 'client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret'
    process.env.GOOGLE_REFRESH_TOKEN = 'refresh-token'
    process.env.GOOGLE_TASK_LIST_ID = 'list-id'
    delete process.env.APPLE_SHORTCUTS_NAME
  })

  it('returns a GoogleTasksProvider (fallback)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const provider = getListProvider()
    expect(provider).toBeInstanceOf(GoogleTasksProvider)
    warn.mockRestore()
  })

  it('logs a warning about google_keep fallback', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    getListProvider()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('google_keep'))
    warn.mockRestore()
  })
})
