import type { ListProvider, AddItemRequest, AddItemResponse, ListItem } from './types'

const BASE_URL = 'https://api.todoist.com/api/v1'

interface TodoistTask {
  id: string
  content: string
  checked: boolean
}

export class TodoistProvider implements ListProvider {
  readonly name = 'todoist'

  private readonly apiToken: string
  private readonly projectId: string | undefined

  constructor(apiToken: string, projectId?: string) {
    this.apiToken = apiToken
    this.projectId = projectId
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
    }
  }

  async add(item: AddItemRequest): Promise<AddItemResponse> {
    const body: Record<string, string> = { content: item.productName }
    if (this.projectId) body.project_id = this.projectId

    const res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error(`Todoist add failed: ${res.status} ${await res.text()}`)
    }

    const task: TodoistTask = await res.json()
    return { ok: true, taskId: task.id }
  }

  async list(): Promise<ListItem[]> {
    const url = new URL(`${BASE_URL}/tasks`)
    if (this.projectId) url.searchParams.set('project_id', this.projectId)

    const res = await fetch(url.toString(), { headers: this.headers() })

    if (!res.ok) {
      throw new Error(`Todoist list failed: ${res.status} ${await res.text()}`)
    }

    const body: { results: TodoistTask[] } = await res.json()
    return (body.results ?? [])
      .filter((t) => !t.checked)
      .map((t) => ({ taskId: t.id, title: t.content }))
  }

  async complete(taskId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}/close`, {
      method: 'POST',
      headers: this.headers(),
    })

    if (!res.ok) {
      throw new Error(`Todoist complete failed: ${res.status} ${await res.text()}`)
    }
  }

  async clear(): Promise<void> {
    const items = await this.list()
    await Promise.all(items.map((item) => this.complete(item.taskId)))
  }
}
