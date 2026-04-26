// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { AppleRemindersProvider } from '@/lib/list-providers/apple-reminders'

const SHORTCUT = 'AddToShopping'

describe('AppleRemindersProvider', () => {
  const provider = new AppleRemindersProvider(SHORTCUT)

  it('has name "apple_reminders"', () => {
    expect(provider.name).toBe('apple_reminders')
  })

  it('returns ok=true', async () => {
    const result = await provider.add({ productName: 'Milk' })
    expect(result.ok).toBe(true)
  })

  it('returns a redirectUrl starting with shortcuts://', async () => {
    const result = await provider.add({ productName: 'Milk' })
    expect(result.redirectUrl).toMatch(/^shortcuts:\/\//)
  })

  it('includes the shortcut name URL-encoded in the redirect URL', async () => {
    const result = await provider.add({ productName: 'Milk' })
    expect(result.redirectUrl).toContain(`name=${encodeURIComponent(SHORTCUT)}`)
  })

  it('encodes shortcut name with spaces correctly', async () => {
    const spacedProvider = new AppleRemindersProvider('Add To Shopping')
    const result = await spacedProvider.add({ productName: 'Milk' })
    expect(result.redirectUrl).toContain('name=Add%20To%20Shopping')
  })

  it('includes the input payload JSON-encoded in the redirect URL', async () => {
    const result = await provider.add({ productName: 'Full Cream Milk 2L' })
    const url = new URL(result.redirectUrl!)
    const input = JSON.parse(url.searchParams.get('input')!)
    expect(input).toEqual({ name: 'Full Cream Milk 2L' })
  })

  it('encodes special characters in product name correctly', async () => {
    const result = await provider.add({ productName: 'Granny Smith Apples (1kg) & More' })
    const url = new URL(result.redirectUrl!)
    const input = JSON.parse(url.searchParams.get('input')!)
    expect(input.name).toBe('Granny Smith Apples (1kg) & More')
  })

  it('includes both name and input query params', async () => {
    const result = await provider.add({ productName: 'Cheese' })
    const url = new URL(result.redirectUrl!)
    expect(url.searchParams.has('name')).toBe(true)
    expect(url.searchParams.has('input')).toBe(true)
  })

  it('list() returns an empty array (write-only provider)', async () => {
    expect(await provider.list()).toEqual([])
  })

  it('complete() resolves without error', async () => {
    await expect(provider.complete('any-id')).resolves.toBeUndefined()
  })

  it('clear() resolves without error', async () => {
    await expect(provider.clear()).resolves.toBeUndefined()
  })
})
