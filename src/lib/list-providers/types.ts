export interface AddItemRequest {
  productName: string
}

export interface AddItemResponse {
  ok: boolean
  redirectUrl?: string
}

export interface ListProvider {
  name: string
  add(item: AddItemRequest): Promise<AddItemResponse>
}
