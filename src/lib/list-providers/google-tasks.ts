import { google } from 'googleapis'
import type { ListProvider, AddItemRequest, AddItemResponse } from './types'

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

  async add(item: AddItemRequest): Promise<AddItemResponse> {
    const auth = new google.auth.OAuth2(this.clientId, this.clientSecret)
    auth.setCredentials({ refresh_token: this.refreshToken })

    const tasks = google.tasks({ version: 'v1', auth })
    await tasks.tasks.insert({
      tasklist: this.taskListId,
      requestBody: {
        title: `${item.productName} (${item.store})`,
      },
    })

    return { ok: true }
  }
}
