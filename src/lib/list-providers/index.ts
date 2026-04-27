import type { ListProvider } from './types'
import { AppleRemindersProvider } from './apple-reminders'
import { GoogleTasksProvider } from './google-tasks'
import { TodoistProvider } from './todoist'

/**
 * Returns the configured list provider, or throws if the configuration is
 * invalid. Throws when LIST_PROVIDER is simply not set — callers treat that
 * as "no external sync, use local cache only".
 */
export function getListProvider(): ListProvider {
  const provider = process.env.LIST_PROVIDER

  if (!provider) {
    throw new Error('LIST_PROVIDER is not configured')
  }

  if (provider === 'apple_reminders') {
    const shortcutName = process.env.APPLE_SHORTCUTS_NAME
    if (!shortcutName) {
      throw new Error('APPLE_SHORTCUTS_NAME is required when LIST_PROVIDER=apple_reminders')
    }
    return new AppleRemindersProvider(shortcutName)
  }

  if (provider === 'todoist') {
    const apiToken = process.env.TODOIST_API_TOKEN
    if (!apiToken) {
      throw new Error('TODOIST_API_TOKEN is required when LIST_PROVIDER=todoist')
    }
    return new TodoistProvider(apiToken, process.env.TODOIST_PROJECT_ID)
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
    `LIST_PROVIDER "${provider}" is not supported. Valid values: todoist, google_tasks, apple_reminders`
  )
}

export { AppleRemindersProvider } from './apple-reminders'
export { GoogleTasksProvider } from './google-tasks'
export { TodoistProvider } from './todoist'
export type { ListProvider, AddItemRequest, AddItemResponse } from './types'
