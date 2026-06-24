import { test, expect, beforeEach } from 'vitest'
import { loadRefreshToken, saveRefreshToken, clearRefreshToken } from '@behaverse/participant-session'

beforeEach(() => localStorage.clear())

test('save then load round-trips the token', () => {
  saveRefreshToken('rt-123')
  expect(loadRefreshToken()).toBe('rt-123')
})

test('load returns null when nothing stored', () => {
  expect(loadRefreshToken()).toBeNull()
})

test('clear removes the token', () => {
  saveRefreshToken('rt-123')
  clearRefreshToken()
  expect(loadRefreshToken()).toBeNull()
})

test('tolerates localStorage throwing (private mode)', () => {
  const orig = Storage.prototype.getItem
  Storage.prototype.getItem = () => { throw new Error('blocked') }
  expect(loadRefreshToken()).toBeNull()
  Storage.prototype.getItem = orig
})
