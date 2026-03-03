import { describe, it, expect } from 'vitest'
import {
  generateRandomDisplayName,
  NAME_PREFIXES,
  NAME_NOUNS,
} from '../random-display-name'

describe('generateRandomDisplayName', () => {
  it('should return a string', () => {
    expect(typeof generateRandomDisplayName()).toBe('string')
  })

  it('should return a non-empty string', () => {
    expect(generateRandomDisplayName().length).toBeGreaterThan(0)
  })

  it('should contain exactly one space separating two words', () => {
    const parts = generateRandomDisplayName().split(' ')
    expect(parts).toHaveLength(2)
  })

  it('should use a prefix from NAME_PREFIXES', () => {
    const [prefix] = generateRandomDisplayName().split(' ')
    expect(NAME_PREFIXES as readonly string[]).toContain(prefix)
  })

  it('should use a noun from NAME_NOUNS', () => {
    const [, noun] = generateRandomDisplayName().split(' ')
    expect(NAME_NOUNS as readonly string[]).toContain(noun)
  })

  it('should not always return the same value (randomness)', () => {
    const results = new Set(Array.from({ length: 100 }, generateRandomDisplayName))
    expect(results.size).toBeGreaterThan(1)
  })

  it('should only produce combinations of known prefixes and nouns', () => {
    for (let i = 0; i < 20; i++) {
      const name = generateRandomDisplayName()
      const [prefix, noun] = name.split(' ')
      expect(NAME_PREFIXES as readonly string[]).toContain(prefix)
      expect(NAME_NOUNS as readonly string[]).toContain(noun)
    }
  })
})

describe('NAME_PREFIXES', () => {
  it('should be a non-empty array', () => {
    expect(NAME_PREFIXES.length).toBeGreaterThan(0)
  })

  it('should contain only non-empty strings', () => {
    NAME_PREFIXES.forEach((p) => expect(p.length).toBeGreaterThan(0))
  })
})

describe('NAME_NOUNS', () => {
  it('should be a non-empty array', () => {
    expect(NAME_NOUNS.length).toBeGreaterThan(0)
  })

  it('should contain only non-empty strings', () => {
    NAME_NOUNS.forEach((n) => expect(n.length).toBeGreaterThan(0))
  })
})
