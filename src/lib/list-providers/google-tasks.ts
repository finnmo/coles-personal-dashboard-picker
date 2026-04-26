import { google } from 'googleapis'
import type { ListProvider, AddItemRequest, AddItemResponse, ListItem } from './types'

export class GoogleTasksProvider implements ListProvider {
  readonly name = 'google_tasks'

  private readonly clientId: string
  private readonly clientSecret: string
  private readonly refreshToken: string
  private readonly taskListId: string

  constructor(clientId: string, clientSecret: string, refreshToken: string, taskListId: string) {
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.refreshToken = refreshToken
    this.taskListId = taskListId
  }

  private getClient() {
    const auth = new google.auth.OAuth2(this.clientId, this.clientSecret)
    auth.setCredentials({ refresh_token: this.refreshToken })
    return google.tasks({ version: 'v1', auth })
  }

  async add(item: AddItemRequest): Promise<AddItemResponse> {
    const tasks = this.getClient()
    const res = await tasks.tasks.insert({
      tasklist: this.taskListId,
      requestBody: { title: item.productName },
    })
    return { ok: true, taskId: res.data.id ?? undefined }
  }

  async list(): Promise<ListItem[]> {
    const tasks = this.getClient()
    const res = await tasks.tasks.list({
      tasklist: this.taskListId,
      showCompleted: false,
      showHidden: false,
      maxResults: 100,
    })
    return (res.data.items ?? [])
      .filter((t) => t.status !== 'completed' && t.id && t.title)
      .map((t) => ({ taskId: t.id!, title: t.title! }))
  }

  async complete(taskId: string): Promise<void> {
    const tasks = this.getClient()
    await tasks.tasks.patch({
      tasklist: this.taskListId,
      task: taskId,
      requestBody: { status: 'completed' },
    })
  }

  async clear(): Promise<void> {
    // Mark all incomplete tasks as completed, then call the Tasks API clear endpoint
    // which purges completed tasks from the list.
    const items = await this.list()
    await Promise.all(items.map((item) => this.complete(item.taskId)))
    const tasks = this.getClient()
    await tasks.tasks.clear({ tasklist: this.taskListId })
  }
}
