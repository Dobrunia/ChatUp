import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Conversation } from '../../types/chat'

let mockFetchConversations: ReturnType<typeof vi.fn>
let mockEnsureConversation: ReturnType<typeof vi.fn>
let mockUpdateLastReadAt: ReturnType<typeof vi.fn>

const makeConversation = (id: string, updatedAt = '2024-01-01T00:00:00Z'): Conversation => ({
  id,
  memberIds: ['user-a', 'user-b'],
  lastMessage: null,
  unreadCount: 0,
  updatedAt,
})

beforeEach(() => {
  vi.resetModules()

  mockFetchConversations = vi.fn().mockResolvedValue([])
  mockEnsureConversation = vi.fn().mockResolvedValue('conv-123')
  mockUpdateLastReadAt = vi.fn().mockResolvedValue(undefined)

  vi.doMock('../../api/conversation-api', () => ({
    fetchConversations: mockFetchConversations,
    ensureConversation: mockEnsureConversation,
    updateLastReadAt: mockUpdateLastReadAt,
  }))
})

// ─── loadConversations ────────────────────────────────────────────────────────

describe('useConversations — loadConversations', () => {
  it('should set conversations from fetch result', async () => {
    const convs = [makeConversation('c1'), makeConversation('c2')]
    mockFetchConversations.mockResolvedValue(convs)

    const { useConversations } = await import('../use-conversations')
    const { conversations, loadConversations } = useConversations()

    await loadConversations('user-a')

    expect(conversations.value).toEqual(convs)
  })

  it('should set conversationsLoading true during fetch then false after', async () => {
    let capturedLoading = false
    mockFetchConversations.mockImplementation(async () => {
      capturedLoading = true
      return []
    })

    const { useConversations } = await import('../use-conversations')
    const { conversationsLoading, loadConversations } = useConversations()

    const promise = loadConversations('user-a')
    expect(conversationsLoading.value).toBe(true)
    await promise
    expect(conversationsLoading.value).toBe(false)
    expect(capturedLoading).toBe(true)
  })

  it('should set conversationsLoading false even when fetch throws', async () => {
    mockFetchConversations.mockRejectedValue(new Error('Network error'))

    const { useConversations } = await import('../use-conversations')
    const { conversationsLoading, loadConversations } = useConversations()

    await expect(loadConversations('user-a')).rejects.toThrow('Network error')
    expect(conversationsLoading.value).toBe(false)
  })

  it('should call fetchConversations with the provided userId', async () => {
    const { useConversations } = await import('../use-conversations')
    const { loadConversations } = useConversations()

    await loadConversations('user-xyz')

    expect(mockFetchConversations).toHaveBeenCalledWith('user-xyz')
  })

  it('should replace conversations on subsequent calls', async () => {
    mockFetchConversations
      .mockResolvedValueOnce([makeConversation('c1')])
      .mockResolvedValueOnce([makeConversation('c2'), makeConversation('c3')])

    const { useConversations } = await import('../use-conversations')
    const { conversations, loadConversations } = useConversations()

    await loadConversations('user-a')
    expect(conversations.value).toHaveLength(1)

    await loadConversations('user-a')
    expect(conversations.value).toHaveLength(2)
  })
})

// ─── refreshConversations ─────────────────────────────────────────────────────

describe('useConversations — refreshConversations', () => {
  it('should update conversations without setting loading flag', async () => {
    const convs = [makeConversation('c1')]
    mockFetchConversations.mockResolvedValue(convs)

    const { useConversations } = await import('../use-conversations')
    const { conversations, conversationsLoading, refreshConversations } = useConversations()

    await refreshConversations('user-a')

    expect(conversations.value).toEqual(convs)
    // Loading was never set to true
    expect(conversationsLoading.value).toBe(false)
  })

  it('should call fetchConversations with the correct userId', async () => {
    const { useConversations } = await import('../use-conversations')
    const { refreshConversations } = useConversations()

    await refreshConversations('user-42')

    expect(mockFetchConversations).toHaveBeenCalledWith('user-42')
  })
})

// ─── openOrCreateConversation ─────────────────────────────────────────────────

describe('useConversations — openOrCreateConversation', () => {
  it('should return conversation id from ensureConversation', async () => {
    mockEnsureConversation.mockResolvedValue('new-conv-id')

    const { useConversations } = await import('../use-conversations')
    const { openOrCreateConversation } = useConversations()

    const id = await openOrCreateConversation('user-a', 'user-b')

    expect(id).toBe('new-conv-id')
    expect(mockEnsureConversation).toHaveBeenCalledWith('user-a', 'user-b')
  })
})

// ─── setConversationRead ──────────────────────────────────────────────────────

describe('useConversations — setConversationRead', () => {
  it('should call updateLastReadAt with correct params', async () => {
    const { useConversations } = await import('../use-conversations')
    const { setConversationRead } = useConversations()

    await setConversationRead('conv-1', 'user-a', '2024-06-01T12:00:00Z')

    expect(mockUpdateLastReadAt).toHaveBeenCalledWith({
      conversationId: 'conv-1',
      userId: 'user-a',
      lastReadAt: '2024-06-01T12:00:00Z',
    })
  })
})
