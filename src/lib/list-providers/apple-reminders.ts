import type { ListProvider, AddItemRequest, AddItemResponse } from './types'

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
}
