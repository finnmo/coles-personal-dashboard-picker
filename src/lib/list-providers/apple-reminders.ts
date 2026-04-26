import type { ListProvider, AddItemRequest, AddItemResponse, ListItem } from './types'

export class AppleRemindersProvider implements ListProvider {
  readonly name = 'apple_reminders'

  private readonly shortcutName: string

  constructor(shortcutName: string) {
    this.shortcutName = shortcutName
  }

  add(item: AddItemRequest): Promise<AddItemResponse> {
    const input = JSON.stringify({ name: item.productName })
    const redirectUrl =
      `shortcuts://run-shortcut` +
      `?name=${encodeURIComponent(this.shortcutName)}` +
      `&input=${encodeURIComponent(input)}`

    return Promise.resolve({ ok: true, redirectUrl })
  }

  // Apple Reminders is one-way (write-only via Shortcuts).
  // These no-ops satisfy the interface so the sidebar still shows
  // the local SQLite cache while using Apple Reminders.
  list(): Promise<ListItem[]> {
    return Promise.resolve([])
  }

  complete(_taskId: string): Promise<void> {
    return Promise.resolve()
  }

  clear(): Promise<void> {
    return Promise.resolve()
  }
}
