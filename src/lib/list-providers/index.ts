import type { ListProvider } from './types'
import { AppleRemindersProvider } from './apple-reminders'
import { GoogleTasksProvider } from './google-tasks'

export function getListProvider(): ListProvider {
  const provider = process.env.LIST_PROVIDER

  if (provider === 'apple_reminders') {
    const shortcutName = process.env.APPLE_SHORTCUTS_NAME
    if (!shortcutName) {
      throw new Error('APPLE_SHORTCUTS_NAME is required when LIST_PROVIDER=apple_reminders')
    }
    return new AppleRemindersProvider(shortcutName)
  }

  if (provider === 'google_tasks' || provider === 'google_keep') {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
    const taskListId = process.env.GOOGLE_TASK_LIST_ID

    if (!clientId || !clientSecret || !refreshToken || !taskListId) {
      throw new Error(
        'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, and GOOGLE_TASK_LIST_ID ' +
          `are required when LIST_PROVIDER=${provider}`
      )
    }

    if (provider === 'google_keep') {
      console.warn(
        '[list-provider] LIST_PROVIDER=google_keep has no official API. ' +
          'Falling back to google_tasks.'
      )
    }

    return new GoogleTasksProvider(clientId, clientSecret, refreshToken, taskListId)
  }

  throw new Error(
    `LIST_PROVIDER "${provider}" is not supported. Valid values: apple_reminders, google_tasks, google_keep`
  )
}

export { AppleRemindersProvider } from './apple-reminders'
export { GoogleTasksProvider } from './google-tasks'
export type { ListProvider, AddItemRequest, AddItemResponse } from './types'
