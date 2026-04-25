export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UPSTREAM_ERROR'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'UNAUTHORISED'
  | 'NOT_IMPLEMENTED'

export type ApiError = {
  error: string
  code: string
}

export type ApiOk = {
  ok: true
}

export type LoginRequest = {
  password: string
}

export type LoginResponse = ApiOk | ApiError

export type PurchaseHistoryResponse = {
  history: Array<{ id: string; purchasedAt: string }>
}
