import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import type { PresenceState } from '../../shared/types/chat'

// ─── Mocks ────────────────────────────────────────────────────────────────────
// vi.mock() is hoisted before variable declarations, so we use vi.hoisted()
// to create the mock functions in the hoisting phase.

const { mockFetchPresenceBatch, mockFetchPresence, mockStartPresence, mockStopPresence } =
  vi.hoisted(() => ({
    mockFetchPresenceBatch: vi.fn(),
    mockFetchPresence: vi.fn(),
    mockStartPresence: vi.fn(),
    mockStopPresence: vi.fn(),
  }))

vi.mock('../../shared/api/presence-api', () => ({
  fetchPresenceBatch: mockFetchPresenceBatch,
  fetchPresence: mockFetchPresence,
}))

vi.mock('../../shared/composables/use-app-realtime', () => ({
  useAppRealtime: vi.fn(() => ({
    typingByConversation: ref({}),
    recordingByConversation: ref({}),
    startGlobal: vi.fn(),
    stopGlobal: vi.fn(),
    startConversation: vi.fn(),
    stopConversation: vi.fn(),
    startPresence: mockStartPresence,
    stopPresence: mockStopPresence,
    emitTypingStart: vi.fn(),
    emitTypingDebouncedStop: vi.fn(),
    emitRecording: vi.fn(),
    stopAll: vi.fn(),
  })),
}))

import { usePresenceStore } from '../presence-store'

const makePresenceState = (userId: string, isOnline: boolean): PresenceState => ({
  userId,
  isOnline,
  updatedAt: new Date().toISOString(),
})

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  mockFetchPresenceBatch.mockResolvedValue([])
  mockFetchPresence.mockResolvedValue(null)
})

// ─── isOnline ─────────────────────────────────────────────────────────────────

describe('presenceStore — isOnline', () => {
  it('should return false for unknown userId', () => {
    const store = usePresenceStore()
    expect(store.isOnline('unknown-user')).toBe(false)
  })

  it('should return true for a user marked online', async () => {
    mockFetchPresenceBatch.mockResolvedValue([makePresenceState('user-1', true)])

    const store = usePresenceStore()
    await store.loadBatch(['user-1'])

    expect(store.isOnline('user-1')).toBe(true)
  })

  it('should return false for a user marked offline', async () => {
    mockFetchPresenceBatch.mockResolvedValue([makePresenceState('user-1', false)])

    const store = usePresenceStore()
    await store.loadBatch(['user-1'])

    expect(store.isOnline('user-1')).toBe(false)
  })
})

// ─── loadBatch ────────────────────────────────────────────────────────────────

describe('presenceStore — loadBatch', () => {
  it('should do nothing when userIds array is empty', async () => {
    const store = usePresenceStore()
    await store.loadBatch([])
    expect(mockFetchPresenceBatch).not.toHaveBeenCalled()
  })

  it('should mark users returned by API as their reported status', async () => {
    mockFetchPresenceBatch.mockResolvedValue([
      makePresenceState('user-1', true),
      makePresenceState('user-2', false),
    ])

    const store = usePresenceStore()
    await store.loadBatch(['user-1', 'user-2'])

    expect(store.isOnline('user-1')).toBe(true)
    expect(store.isOnline('user-2')).toBe(false)
  })

  it('should mark users absent from API response as offline', async () => {
    // user-2 is not in the response — no presence row in DB
    mockFetchPresenceBatch.mockResolvedValue([makePresenceState('user-1', true)])

    const store = usePresenceStore()
    await store.loadBatch(['user-1', 'user-2', 'user-3'])

    expect(store.isOnline('user-1')).toBe(true)
    expect(store.isOnline('user-2')).toBe(false)
    expect(store.isOnline('user-3')).toBe(false)
  })

  it('should merge new data with existing presenceMap without clearing it', async () => {
    mockFetchPresenceBatch
      .mockResolvedValueOnce([makePresenceState('user-1', true)])
      .mockResolvedValueOnce([makePresenceState('user-2', true)])

    const store = usePresenceStore()
    await store.loadBatch(['user-1'])
    await store.loadBatch(['user-2'])

    expect(store.isOnline('user-1')).toBe(true)
    expect(store.isOnline('user-2')).toBe(true)
  })

  it('should not throw when API fetch fails', async () => {
    mockFetchPresenceBatch.mockRejectedValue(new Error('Network error'))

    const store = usePresenceStore()
    await expect(store.loadBatch(['user-1'])).resolves.toBeUndefined()
  })

  it('should call fetchPresenceBatch with the provided user ids', async () => {
    const store = usePresenceStore()
    await store.loadBatch(['a', 'b', 'c'])
    expect(mockFetchPresenceBatch).toHaveBeenCalledWith(['a', 'b', 'c'])
  })
})

// ─── trackPeer ────────────────────────────────────────────────────────────────

describe('presenceStore — trackPeer', () => {
  it('should set peer online status from initial fetch', async () => {
    mockFetchPresence.mockResolvedValue(makePresenceState('peer-1', true))

    const store = usePresenceStore()
    await store.trackPeer('peer-1')

    expect(store.isOnline('peer-1')).toBe(true)
  })

  it('should set peer as offline when initial fetch returns null', async () => {
    mockFetchPresence.mockResolvedValue(null)

    const store = usePresenceStore()
    await store.trackPeer('peer-1')

    expect(store.isOnline('peer-1')).toBe(false)
  })

  it('should default to offline when initial fetch throws', async () => {
    mockFetchPresence.mockRejectedValue(new Error('DB error'))

    const store = usePresenceStore()
    await store.trackPeer('peer-1')

    expect(store.isOnline('peer-1')).toBe(false)
  })

  it('should start presence realtime subscription for peer', async () => {
    mockFetchPresence.mockResolvedValue(makePresenceState('peer-1', false))

    const store = usePresenceStore()
    await store.trackPeer('peer-1')

    expect(mockStartPresence).toHaveBeenCalledWith('peer-1', expect.any(Function))
  })

  it('should update presenceMap when realtime callback fires', async () => {
    mockFetchPresence.mockResolvedValue(makePresenceState('peer-1', false))

    const store = usePresenceStore()
    await store.trackPeer('peer-1')

    // Simulate realtime event: peer came online
    const realtimeCallback = mockStartPresence.mock.calls[0][1] as (s: PresenceState) => void
    realtimeCallback(makePresenceState('peer-1', true))

    expect(store.isOnline('peer-1')).toBe(true)
  })
})

// ─── stopTracking ─────────────────────────────────────────────────────────────

describe('presenceStore — stopTracking', () => {
  it('should call stopPresence on the realtime layer', () => {
    const store = usePresenceStore()
    store.stopTracking()
    expect(mockStopPresence).toHaveBeenCalled()
  })
})
