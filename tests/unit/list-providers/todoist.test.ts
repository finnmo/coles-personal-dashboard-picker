// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TodoistProvider } from '@/lib/list-providers/todoist'
import { getListProvider } from '@/lib/list-providers'

const API_TOKEN = 'test-api-token'
const PROJECT_ID = 'test-project-id'

function makeProvider(projectId?: string) {
  return new TodoistProvider(API_TOKEN, projectId)
}

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  })
}

describe('TodoistProvider', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('has name "todoist"', () => {
    expect(makeProvider().name).toBe('todoist')
  })

  describe('add()', () => {
    it('returns ok=true on successful task creation', async () => {
      mockFetch.mockReturnValueOnce(jsonResponse({ id: 'task-123', content: 'Milk' }))
      const result = await makeProvider().add({ productName: 'Milk' })
      expect(result.ok).toBe(true)
    })

    it('returns the taskId from the created task', async () => {
      mockFetch.mockReturnValueOnce(jsonResponse({ id: 'task-123', content: 'Milk' }))
      const result = await makeProvider().add({ productName: 'Milk' })
      expect(result.taskId).toBe('task-123')
    })

    it('posts to /tasks with product name as content', async () => {
      mockFetch.mockReturnValueOnce(jsonResponse({ id: 'task-123', content: 'Greek Yogurt' }))
      await makeProvider().add({ productName: 'Greek Yogurt' })
      const [url, init] = mockFetch.mock.calls[0]
      expect(url).toContain('/tasks')
      expect(JSON.parse(init.body)).toMatchObject({ content: 'Greek Yogurt' })
    })

    it('includes project_id when provided', async () => {
      mockFetch.mockReturnValueOnce(jsonResponse({ id: 'task-123', content: 'Eggs' }))
      await makeProvider(PROJECT_ID).add({ productName: 'Eggs' })
      const [, init] = mockFetch.mock.calls[0]
      expect(JSON.parse(init.body)).toMatchObject({ project_id: PROJECT_ID })
    })

    it('omits project_id when not provided', async () => {
      mockFetch.mockReturnValueOnce(jsonResponse({ id: 'task-123', content: 'Eggs' }))
      await makeProvider().add({ productName: 'Eggs' })
      const [, init] = mockFetch.mock.calls[0]
      expect(JSON.parse(init.body)).not.toHaveProperty('project_id')
    })

    it('throws on non-200 response', async () => {
      mockFetch.mockReturnValueOnce(jsonResponse({ error: 'Unauthorized' }, 401))
      await expect(makeProvider().add({ productName: 'Milk' })).rejects.toThrow('401')
    })
  })

  describe('list()', () => {
    it('returns incomplete tasks as ListItem array', async () => {
      mockFetch.mockReturnValueOnce(
        jsonResponse([
          { id: 'task-1', content: 'Milk', is_completed: false },
          { id: 'task-2', content: 'Eggs', is_completed: false },
        ])
      )
      const items = await makeProvider().list()
      expect(items).toHaveLength(2)
      expect(items[0]).toEqual({ taskId: 'task-1', title: 'Milk' })
    })

    it('filters out completed tasks', async () => {
      mockFetch.mockReturnValueOnce(
        jsonResponse([
          { id: 'task-1', content: 'Milk', is_completed: true },
          { id: 'task-2', content: 'Eggs', is_completed: false },
        ])
      )
      const items = await makeProvider().list()
      expect(items).toHaveLength(1)
      expect(items[0].title).toBe('Eggs')
    })

    it('includes project_id in query when provided', async () => {
      mockFetch.mockReturnValueOnce(jsonResponse([]))
      await makeProvider(PROJECT_ID).list()
      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain(`project_id=${PROJECT_ID}`)
    })

    it('throws on non-200 response', async () => {
      mockFetch.mockReturnValueOnce(jsonResponse({ error: 'Forbidden' }, 403))
      await expect(makeProvider().list()).rejects.toThrow('403')
    })
  })

  describe('complete()', () => {
    it('posts to /tasks/{id}/close', async () => {
      mockFetch.mockReturnValueOnce(
        Promise.resolve({ ok: true, status: 204, text: () => Promise.resolve('') })
      )
      await makeProvider().complete('task-abc')
      const [url, init] = mockFetch.mock.calls[0]
      expect(url).toContain('/tasks/task-abc/close')
      expect(init.method).toBe('POST')
    })

    it('throws on non-200 response', async () => {
      mockFetch.mockReturnValueOnce(
        Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve('Not found') })
      )
      await expect(makeProvider().complete('bad-id')).rejects.toThrow('404')
    })
  })

  describe('clear()', () => {
    it('completes all listed tasks', async () => {
      mockFetch
        .mockReturnValueOnce(
          jsonResponse([
            { id: 'task-1', content: 'Milk', is_completed: false },
            { id: 'task-2', content: 'Eggs', is_completed: false },
          ])
        )
        .mockReturnValue(
          Promise.resolve({ ok: true, status: 204, text: () => Promise.resolve('') })
        )

      await makeProvider().clear()
      // 1 list call + 2 complete calls
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })
  })
})

describe('getListProvider — todoist', () => {
  beforeEach(() => {
    process.env.LIST_PROVIDER = 'todoist'
    process.env.TODOIST_API_TOKEN = 'test-token'
    delete process.env.TODOIST_PROJECT_ID
    delete process.env.APPLE_SHORTCUTS_NAME
  })

  it('returns a TodoistProvider instance', () => {
    const provider = getListProvider()
    expect(provider).toBeInstanceOf(TodoistProvider)
    expect(provider.name).toBe('todoist')
  })

  it('throws when TODOIST_API_TOKEN is missing', () => {
    delete process.env.TODOIST_API_TOKEN
    expect(() => getListProvider()).toThrow(/TODOIST_API_TOKEN/)
  })
})
