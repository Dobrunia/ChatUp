import { describe, it, expect } from 'vitest'
import { isValidUsername, sanitizeDisplayName, resolveUserTitle } from '../profile'

describe('isValidUsername', () => {
  it('should return true for lowercase-only string', () => {
    expect(isValidUsername('alice')).toBe(true)
  })

  it('should return true for single lowercase letter', () => {
    expect(isValidUsername('a')).toBe(true)
  })

  it('should return false for empty string', () => {
    expect(isValidUsername('')).toBe(false)
  })

  it('should return false for string with uppercase letters', () => {
    expect(isValidUsername('Alice')).toBe(false)
  })

  it('should return false for all-uppercase string', () => {
    expect(isValidUsername('ALICE')).toBe(false)
  })

  it('should return false for string with digits', () => {
    expect(isValidUsername('abc123')).toBe(false)
  })

  it('should return false for string with underscore', () => {
    expect(isValidUsername('ab_c')).toBe(false)
  })

  it('should return false for string with hyphen', () => {
    expect(isValidUsername('ab-c')).toBe(false)
  })

  it('should return false for string with spaces', () => {
    expect(isValidUsername('a b')).toBe(false)
  })

  it('should return false for string with special characters', () => {
    expect(isValidUsername('a@b')).toBe(false)
  })
})

describe('sanitizeDisplayName', () => {
  it('should return plain string unchanged (besides trim)', () => {
    expect(sanitizeDisplayName('Hello World')).toBe('Hello World')
  })

  it('should escape < character', () => {
    expect(sanitizeDisplayName('<script>')).toBe('&lt;script&gt;')
  })

  it('should escape > character', () => {
    expect(sanitizeDisplayName('a>b')).toBe('a&gt;b')
  })

  it('should escape & character', () => {
    expect(sanitizeDisplayName('a & b')).toBe('a &amp; b')
  })

  it('should escape all three special characters together', () => {
    expect(sanitizeDisplayName('<a>&')).toBe('&lt;a&gt;&amp;')
  })

  it('should trim leading whitespace', () => {
    expect(sanitizeDisplayName('  hello')).toBe('hello')
  })

  it('should trim trailing whitespace', () => {
    expect(sanitizeDisplayName('hello  ')).toBe('hello')
  })

  it('should trim both sides', () => {
    expect(sanitizeDisplayName('  hello  ')).toBe('hello')
  })

  it('should return empty string for whitespace-only input', () => {
    expect(sanitizeDisplayName('   ')).toBe('')
  })

  it('should escape multiple & in one string', () => {
    expect(sanitizeDisplayName('a & b & c')).toBe('a &amp; b &amp; c')
  })

  it('should escape & before trimming', () => {
    expect(sanitizeDisplayName('  a&b  ')).toBe('a&amp;b')
  })
})

describe('resolveUserTitle', () => {
  it('should return displayName when both username and displayName are provided', () => {
    expect(resolveUserTitle('alice', 'Alice Cooper')).toBe('Alice Cooper')
  })

  it('should return displayName when username is null', () => {
    expect(resolveUserTitle(null, 'Alice')).toBe('Alice')
  })

  it('should return @username when displayName is null', () => {
    expect(resolveUserTitle('alice', null)).toBe('@alice')
  })

  it('should return @username when displayName is empty string', () => {
    expect(resolveUserTitle('alice', '')).toBe('@alice')
  })

  it('should return "User" when both are null', () => {
    expect(resolveUserTitle(null, null)).toBe('User')
  })

  it('should return "User" when both are empty strings', () => {
    expect(resolveUserTitle('', '')).toBe('User')
  })

  it('should return "User" when username is empty and displayName is null', () => {
    expect(resolveUserTitle('', null)).toBe('User')
  })

  it('should prefer displayName over username when both are non-empty', () => {
    expect(resolveUserTitle('bob', 'Bob Smith')).toBe('Bob Smith')
  })

  it('should prefix username with @ sign', () => {
    expect(resolveUserTitle('johndoe', null)).toBe('@johndoe')
  })
})
