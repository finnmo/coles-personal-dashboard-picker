export interface AddItemRequest {
  productName: string
}

export interface AddItemResponse {
  ok: boolean
  taskId?: string
  redirectUrl?: string
}

export interface ListItem {
  taskId: string
  title: string
}

export interface ListProvider {
  name: string
  add(item: AddItemRequest): Promise<AddItemResponse>
  list(): Promise<ListItem[]>
  complete(taskId: string): Promise<void>
  clear(): Promise<void>
}
