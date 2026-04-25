import { NextResponse } from 'next/server'
import type { ApiErrorCode } from '@/types/api'

export function apiError(message: string, code: ApiErrorCode, status: number): NextResponse {
  return NextResponse.json({ error: message, code }, { status })
}

export function apiOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}
