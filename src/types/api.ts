export type ApiError = {
  error: string
}

export type ApiOk = {
  ok: true
}

export type LoginRequest = {
  password: string
}

export type LoginResponse = ApiOk | ApiError
