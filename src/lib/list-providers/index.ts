import type { ListProvider } from './types'
import { AppleRemindersProvider } from './apple-reminders'

export function getListProvider(): ListProvider {
  const provider = process.env.LIST_PROVIDER

  if (provider === 'apple_reminders') {
    const shortcutName = process.env.APPLE_SHORTCUTS_NAME
    if (!shortcutName) {
      throw new Error('APPLE_SHORTCUTS_NAME is required when LIST_PROVIDER=apple_reminders')
    }
    return new AppleRemindersProvider(shortcutName)
  }

  // google_tasks and google_keep are handled in Branch 7
  throw new Error(`LIST_PROVIDER "${provider}" is not yet supported. Supported: apple_reminders`)
}

export { AppleRemindersProvider } from './apple-reminders'
export type { ListProvider, AddItemRequest, AddItemResponse } from './types'
