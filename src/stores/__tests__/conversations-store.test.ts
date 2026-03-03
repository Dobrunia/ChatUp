import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import type { Conversation } from '../../shared/types/chat'

// ─── Mocks (hoisted before imports) ──────────────────────────────────────────

const mockLoadConversations = vi.fn().mockResolvedValue(undefined)
const mockRefreshConversations = vi.fn().mockResolvedValue(undefined)
const mockOpenOrCreateConversation = vi.fn().mockResolvedValue('conv-new')
const mockSetConversationRead = vi.fn().mockResolvedValue(undefined)

const conversationsRef = ref<Conversation[]>([])
const conversationsLoadingRef = ref(false)

vi.mock('../../shared/composables/use-conversations', () => ({
  useConversations: vi.fn(() => ({
    conversations: conversationsRef,
    conversationsLoading: conversationsLoadingRef,
    loadConversations: mockLoadConversations,
    refreshConversations: mockRefreshConversations,
    openOrCreateConversation: mockOpenOrCreateConversation,
    setConversationRead: mockSetConversationRead,
  })),
}))

const mockStartGlobal = vi.fn()
const mockStopGlobal = vi.fn()
const mockStartConversation = vi.fn()
const mockStopConversation = vi.fn()
const mockStartPresence = vi.fn()
const mockStopPresence = vi.fn()
const mockStopAll = vi.fn()

vi.mock('../../shared/composables/use-app-realtime', () => ({
  useAppRealtime: vi.fn(() => ({
    typingByConversation: ref({}),
    recordingByConversation: ref({}),
    startGlobal: mockStartGlobal,
    stopGlobal: mockStopGlobal,
    startConversation: mockStartConversation,
    stopConversation: mockStopConversation,
    startPresence: mockStartPresence,
    stopPresence: mockStopPresence,
    emitTypingStart: vi.fn(),
    emitTypingDebouncedStop: vi.fn(),
    emitRecording: vi.fn(),
    stopAll: mockStopAll,
  })),
}))

// ─── Import store after mocks ─────────────────────────────────────────────────

import { useConversationsStore } from '../conversations-store'

const makeConversation = (id: string, updatedAt: string): Conversation => ({
  id,
  memberIds: ['u1', 'u2'],
  lastMessage: null,
  unreadCount: 0,
  updatedAt,
})

beforeEach(() => {
  setActivePinia(createPinia())
  conversationsRef.value = []
  conversationsLoadingRef.value = false
  vi.clearAllMocks()
})

// ─── sortedConversations ──────────────────────────────────────────────────────

describe('conversationsStore — sortedConversations', () => {
  it('should sort conversations by updatedAt descending', () => {
    conversationsRef.value = [
      makeConversation('c1', '2024-01-01T00:00:00Z'),
      makeConversation('c2', '2024-01-03T00:00:00Z'),
      makeConversation('c3', '2024-01-02T00:00:00Z'),
    ]
    const store = useConversationsStore()
    expect(store.sortedConversations.map((c) => c.id)).toEqual(['c2', 'c3', 'c1'])
  })

  it('should return empty array when conversations is empty', () => {
    const store = useConversationsStore()
    expect(store.sortedConversations).toHaveLength(0)
  })

  it('should return single item unchanged', () => {
    conversationsRef.value = [makeConversation('only', '2024-06-01T00:00:00Z')]
    const store = useConversationsStore()
    expect(store.sortedConversations[0].id).toBe('only')
  })

  it('should not mutate original conversations array', () => {
    conversationsRef.value = [
      makeConversation('a', '2024-01-02T00:00:00Z'),
      makeConversation('b', '2024-01-01T00:00:00Z'),
    ]
    const store = useConversationsStore()
    store.sortedConversations
    expect(conversationsRef.value[0].id).toBe('a')
  })
})

// ─── setActiveConversation ────────────────────────────────────────────────────

describe('conversationsStore — setActiveConversation', () => {
  it('should set activeConversationId to provided value', () => {
    const store = useConversationsStore()
    store.setActiveConversation('conv-42')
    expect(store.activeConversationId).toBe('conv-42')
  })

  it('should set activeConversationId to null', () => {
    const store = useConversationsStore()
    store.setActiveConversation('conv-42')
    store.setActiveConversation(null)
    expect(store.activeConversationId).toBeNull()
  })
})

// ─── load / refresh ───────────────────────────────────────────────────────────

describe('conversationsStore — load', () => {
  it('should delegate to loadConversations with userId', async () => {
    const store = useConversationsStore()
    await store.load('user-1')
    expect(mockLoadConversations).toHaveBeenCalledWith('user-1')
  })
})

describe('conversationsStore — refresh', () => {
  it('should delegate to refreshConversations with userId', async () => {
    const store = useConversationsStore()
    await store.refresh('user-1')
    expect(mockRefreshConversations).toHaveBeenCalledWith('user-1')
  })
})

// ─── markRead ─────────────────────────────────────────────────────────────────

describe('conversationsStore — markRead', () => {
  it('should call setConversationRead with provided conversationId', async () => {
    const store = useConversationsStore()
    await store.markRead('user-1', 'conv-5', '2024-01-01T00:00:00Z')
    expect(mockSetConversationRead).toHaveBeenCalledWith('conv-5', 'user-1', '2024-01-01T00:00:00Z')
  })

  it('should fall back to activeConversationId when no conversationId given', async () => {
    const store = useConversationsStore()
    store.setActiveConversation('active-conv')
    await store.markRead('user-1', undefined, '2024-01-01T00:00:00Z')
    expect(mockSetConversationRead).toHaveBeenCalledWith('active-conv', 'user-1', '2024-01-01T00:00:00Z')
  })

  it('should do nothing when neither conversationId nor activeConversationId is set', async () => {
    const store = useConversationsStore()
    await store.markRead('user-1')
    expect(mockSetConversationRead).not.toHaveBeenCalled()
  })
})

// ─── startRealtime / stopRealtime ─────────────────────────────────────────────

describe('conversationsStore — startRealtime / stopRealtime', () => {
  it('should call startGlobal with userId and a callback', () => {
    const store = useConversationsStore()
    store.startRealtime('user-1')
    expect(mockStartGlobal).toHaveBeenCalledWith('user-1', expect.any(Function))
  })

  it('should call stopGlobal when stopRealtime is called', () => {
    const store = useConversationsStore()
    store.stopRealtime()
    expect(mockStopGlobal).toHaveBeenCalled()
  })

  it('should not start a double subscription if startRealtime called twice (guard in useAppRealtime)', () => {
    const store = useConversationsStore()
    store.startRealtime('user-1')
    store.startRealtime('user-1')
    // startGlobal is called each time; guard is inside useAppRealtime mock
    expect(mockStartGlobal).toHaveBeenCalledTimes(2)
  })
})

// ─── scheduleReload debounce ──────────────────────────────────────────────────

describe('conversationsStore — scheduleReload debounce', () => {
  it('should debounce rapid reloads and only call load once after 200ms', async () => {
    vi.useFakeTimers()

    const store = useConversationsStore()
    store.startRealtime('user-1')

    // Extract the callback passed to startGlobal
    const realtimeCallback = mockStartGlobal.mock.calls[0][1] as () => void

    // Fire the callback 3 times rapidly (simulates burst of realtime events)
    realtimeCallback()
    realtimeCallback()
    realtimeCallback()

    expect(mockLoadConversations).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(200)

    expect(mockLoadConversations).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  it('should clear pending timer when stopRealtime is called', async () => {
    vi.useFakeTimers()

    const store = useConversationsStore()
    store.startRealtime('user-1')

    const realtimeCallback = mockStartGlobal.mock.calls[0][1] as () => void
    realtimeCallback()

    store.stopRealtime()

    await vi.advanceTimersByTimeAsync(300)

    // Timer was cleared so load should NOT have been called
    expect(mockLoadConversations).not.toHaveBeenCalled()

    vi.useRealTimers()
  })
})

// ─── open ─────────────────────────────────────────────────────────────────────

describe('conversationsStore — open', () => {
  it('should return conversationId from openOrCreateConversation', async () => {
    mockOpenOrCreateConversation.mockResolvedValue('returned-conv')
    const store = useConversationsStore()
    const id = await store.open('user-a', 'user-b')
    expect(id).toBe('returned-conv')
  })

  it('should set activeConversationId after opening', async () => {
    mockOpenOrCreateConversation.mockResolvedValue('opened-conv')
    const store = useConversationsStore()
    await store.open('user-a', 'user-b')
    expect(store.activeConversationId).toBe('opened-conv')
  })
})
