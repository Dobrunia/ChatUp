import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Message } from '../../types/chat'

// ─── Shared mock fns (recreated each test via beforeEach) ────────────────────

let mockFetchMessages: ReturnType<typeof vi.fn>
let mockInsertMessage: ReturnType<typeof vi.fn>
let mockUploadMedia: ReturnType<typeof vi.fn>
let mockNanoid: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.resetModules()

  mockFetchMessages = vi.fn().mockResolvedValue([])
  mockInsertMessage = vi.fn()
  mockUploadMedia = vi.fn().mockResolvedValue('https://cdn.example.com/file.jpg')
  mockNanoid = vi.fn().mockReturnValue('mock-id-123')

  vi.doMock('../../api/message-api', () => ({
    fetchMessages: mockFetchMessages,
    insertMessage: mockInsertMessage,
  }))

  vi.doMock('../../api/media-api', () => ({
    uploadMedia: mockUploadMedia,
  }))

  vi.doMock('nanoid', () => ({
    nanoid: mockNanoid,
  }))
})

// ─── loadMessages ─────────────────────────────────────────────────────────────

describe('useChat — loadMessages', () => {
  it('should set messages from fetch result', async () => {
    const msgs: Message[] = [
      {
        id: '1',
        conversationId: 'c1',
        senderId: 'u1',
        type: 'text',
        body: 'Hello',
        media: null,
        createdAt: '2024-01-01T00:00:00Z',
        status: 'sent',
      },
    ]
    mockFetchMessages.mockResolvedValue(msgs)

    const { useChat } = await import('../use-chat')
    const { messages, loadMessages } = useChat()

    await loadMessages('c1')

    expect(messages.value).toEqual(msgs)
  })

  it('should set loading true during fetch then false after', async () => {
    let capturedLoading = false
    mockFetchMessages.mockImplementation(async () => {
      capturedLoading = true
      return []
    })

    const { useChat } = await import('../use-chat')
    const { messageLoading, loadMessages } = useChat()

    const promise = loadMessages('c1')
    expect(messageLoading.value).toBe(true)
    await promise
    expect(messageLoading.value).toBe(false)
    expect(capturedLoading).toBe(true)
  })

  it('should set hasMoreMessages true when result equals PAGE_SIZE (20)', async () => {
    mockFetchMessages.mockResolvedValue(Array.from({ length: 20 }, (_, i) => ({
      id: `${i}`,
      conversationId: 'c1',
      senderId: 'u1',
      type: 'text' as const,
      body: 'msg',
      media: null,
      createdAt: '2024-01-01T00:00:00Z',
      status: 'sent' as const,
    })))

    const { useChat } = await import('../use-chat')
    const { hasMoreMessages, loadMessages } = useChat()

    await loadMessages('c1')

    expect(hasMoreMessages.value).toBe(true)
  })

  it('should set hasMoreMessages false when result is less than PAGE_SIZE', async () => {
    mockFetchMessages.mockResolvedValue([
      { id: '1', conversationId: 'c1', senderId: 'u1', type: 'text', body: 'hi', media: null, createdAt: '2024-01-01T00:00:00Z', status: 'sent' },
    ])

    const { useChat } = await import('../use-chat')
    const { hasMoreMessages, loadMessages } = useChat()

    await loadMessages('c1')

    expect(hasMoreMessages.value).toBe(false)
  })

  it('should reset loading to false even if fetch throws', async () => {
    mockFetchMessages.mockRejectedValue(new Error('Network error'))

    const { useChat } = await import('../use-chat')
    const { messageLoading, loadMessages } = useChat()

    await expect(loadMessages('c1')).rejects.toThrow('Network error')
    expect(messageLoading.value).toBe(false)
  })
})

// ─── refreshMessages ──────────────────────────────────────────────────────────

describe('useChat — refreshMessages', () => {
  it('should update messages without touching messageLoading', async () => {
    const fresh: Message[] = [
      { id: '99', conversationId: 'c1', senderId: 'u1', type: 'text', body: 'fresh', media: null, createdAt: '2024-01-02T00:00:00Z', status: 'sent' },
    ]
    mockFetchMessages.mockResolvedValue(fresh)

    const { useChat } = await import('../use-chat')
    const { messages, messageLoading, refreshMessages } = useChat()

    await refreshMessages('c1')

    expect(messages.value).toEqual(fresh)
    expect(messageLoading.value).toBe(false)
  })
})

// ─── loadOlderMessages ────────────────────────────────────────────────────────

describe('useChat — loadOlderMessages', () => {
  it('should return false when no active conversation is set', async () => {
    const { useChat } = await import('../use-chat')
    const { loadOlderMessages } = useChat()

    const result = await loadOlderMessages()

    expect(result).toBe(false)
  })

  it('should return false when messages list is empty', async () => {
    mockFetchMessages.mockResolvedValue([])

    const { useChat } = await import('../use-chat')
    const { loadMessages, loadOlderMessages } = useChat()

    await loadMessages('c1')
    const result = await loadOlderMessages()

    expect(result).toBe(false)
  })

  it('should return false when hasMoreMessages is false', async () => {
    // < 20 messages means hasMoreMessages=false
    mockFetchMessages.mockResolvedValue([
      { id: '1', conversationId: 'c1', senderId: 'u1', type: 'text', body: 'hi', media: null, createdAt: '2024-01-01T00:00:00Z', status: 'sent' },
    ])

    const { useChat } = await import('../use-chat')
    const { loadMessages, loadOlderMessages } = useChat()

    await loadMessages('c1')
    const result = await loadOlderMessages()

    expect(result).toBe(false)
  })

  it('should prepend unique older messages and return true', async () => {
    const page1: Message[] = Array.from({ length: 20 }, (_, i) => ({
      id: `new-${i}`,
      conversationId: 'c1',
      senderId: 'u1',
      type: 'text' as const,
      body: `msg ${i}`,
      media: null,
      createdAt: `2024-01-02T00:00:0${i % 10}Z`,
      status: 'sent' as const,
    }))
    const page2: Message[] = Array.from({ length: 5 }, (_, i) => ({
      id: `old-${i}`,
      conversationId: 'c1',
      senderId: 'u1',
      type: 'text' as const,
      body: `older ${i}`,
      media: null,
      createdAt: `2024-01-01T00:00:0${i}Z`,
      status: 'sent' as const,
    }))

    mockFetchMessages.mockResolvedValueOnce(page1).mockResolvedValueOnce(page2)

    const { useChat } = await import('../use-chat')
    const { messages, loadMessages, loadOlderMessages } = useChat()

    await loadMessages('c1')
    const result = await loadOlderMessages()

    expect(result).toBe(true)
    expect(messages.value.slice(0, 5).map((m) => m.id)).toEqual(['old-0', 'old-1', 'old-2', 'old-3', 'old-4'])
    expect(messages.value.length).toBe(25)
  })

  it('should deduplicate messages that already exist in the list', async () => {
    const existing: Message[] = Array.from({ length: 20 }, (_, i) => ({
      id: `msg-${i}`,
      conversationId: 'c1',
      senderId: 'u1',
      type: 'text' as const,
      body: `msg ${i}`,
      media: null,
      createdAt: `2024-01-02T00:00:0${i % 10}Z`,
      status: 'sent' as const,
    }))

    // Second fetch returns overlapping ids
    mockFetchMessages
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(existing.slice(0, 5))

    const { useChat } = await import('../use-chat')
    const { messages, loadMessages, loadOlderMessages } = useChat()

    await loadMessages('c1')
    const result = await loadOlderMessages()

    // All returned messages are duplicates → returns false
    expect(result).toBe(false)
    expect(messages.value.length).toBe(20)
  })
})

// ─── sendImageMessages ────────────────────────────────────────────────────────

describe('useChat — sendImageMessages', () => {
  it('should throw when more than 4 files are provided', async () => {
    const { useChat } = await import('../use-chat')
    const { sendImageMessages } = useChat()

    const files = Array.from({ length: 5 }, () => new File([''], 'img.jpg', { type: 'image/jpeg' }))

    await expect(sendImageMessages('c1', 'u1', files)).rejects.toThrow('Max 4 images per send')
  })

  it('should not throw for exactly 4 files', async () => {
    const saved: Message = { id: 'server-id', conversationId: 'c1', senderId: 'u1', type: 'image', body: null, media: { url: 'https://cdn.example.com/file.jpg', type: 'image', size: 100 }, createdAt: '2024-01-01T00:00:00Z', status: 'sent' }
    mockInsertMessage.mockResolvedValue(saved)

    const { useChat } = await import('../use-chat')
    const { sendImageMessages } = useChat()

    const files = Array.from({ length: 4 }, () => new File(['x'], 'img.jpg', { type: 'image/jpeg' }))
    await expect(sendImageMessages('c1', 'u1', files)).resolves.toBeUndefined()
    expect(mockUploadMedia).toHaveBeenCalledTimes(4)
  })

  it('should upload each file and insert a message for each', async () => {
    const saved: Message = { id: 'server-id', conversationId: 'c1', senderId: 'u1', type: 'image', body: null, media: { url: 'https://cdn.example.com/file.jpg', type: 'image', size: 42 }, createdAt: '2024-01-01T00:00:00Z', status: 'sent' }
    mockInsertMessage.mockResolvedValue(saved)

    const { useChat } = await import('../use-chat')
    const { sendImageMessages } = useChat()

    const files = [
      new File(['a'], 'a.jpg', { type: 'image/jpeg' }),
      new File(['bb'], 'b.jpg', { type: 'image/jpeg' }),
    ]
    await sendImageMessages('c1', 'u1', files)

    expect(mockUploadMedia).toHaveBeenCalledTimes(2)
    expect(mockInsertMessage).toHaveBeenCalledTimes(2)
  })
})

// ─── sendAudioMessage ─────────────────────────────────────────────────────────

describe('useChat — sendAudioMessage', () => {
  it('should throw when duration exceeds 120 seconds', async () => {
    const { useChat } = await import('../use-chat')
    const { sendAudioMessage } = useChat()

    const file = new File(['audio'], 'voice.ogg', { type: 'audio/ogg' })
    await expect(sendAudioMessage('c1', 'u1', file, 121)).rejects.toThrow('Audio max duration is 2 minutes')
  })

  it('should throw for duration exactly equal to 121', async () => {
    const { useChat } = await import('../use-chat')
    const { sendAudioMessage } = useChat()

    const file = new File(['audio'], 'voice.ogg', { type: 'audio/ogg' })
    await expect(sendAudioMessage('c1', 'u1', file, 121)).rejects.toThrow()
  })

  it('should not throw for duration of exactly 120 seconds', async () => {
    const saved: Message = { id: 'srv', conversationId: 'c1', senderId: 'u1', type: 'audio', body: null, media: { url: 'https://cdn.example.com/voice.ogg', type: 'audio', size: 1024, duration: 120 }, createdAt: '2024-01-01T00:00:00Z', status: 'sent' }
    mockInsertMessage.mockResolvedValue(saved)

    const { useChat } = await import('../use-chat')
    const { sendAudioMessage } = useChat()

    const file = new File(['audio'], 'voice.ogg', { type: 'audio/ogg' })
    await expect(sendAudioMessage('c1', 'u1', file, 120)).resolves.toBeUndefined()
  })

  it('should upload file and insert message with duration', async () => {
    const saved: Message = { id: 'srv', conversationId: 'c1', senderId: 'u1', type: 'audio', body: null, media: { url: 'https://cdn.example.com/voice.ogg', type: 'audio', size: 512, duration: 15 }, createdAt: '2024-01-01T00:00:00Z', status: 'sent' }
    mockInsertMessage.mockResolvedValue(saved)

    const { useChat } = await import('../use-chat')
    const { sendAudioMessage } = useChat()

    const file = new File(['audio'], 'voice.ogg', { type: 'audio/ogg' })
    await sendAudioMessage('c1', 'u1', file, 15)

    expect(mockUploadMedia).toHaveBeenCalledWith('audio/c1', file)
    expect(mockInsertMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'audio',
        media: expect.objectContaining({ duration: 15 }),
      }),
    )
  })
})

// ─── sendMessage (optimistic update) ─────────────────────────────────────────

describe('useChat — sendTextMessage optimistic update', () => {
  it('should add optimistic message with status "sending" before insert resolves', async () => {
    let resolveInsert!: (m: Message) => void
    const insertPromise = new Promise<Message>((res) => { resolveInsert = res })
    mockInsertMessage.mockReturnValue(insertPromise)

    const { useChat } = await import('../use-chat')
    const { messages, sendTextMessage } = useChat()

    const sendPromise = sendTextMessage('c1', 'u1', 'Hello')

    // Before insert resolves, the optimistic message should be present
    expect(messages.value).toHaveLength(1)
    expect(messages.value[0].status).toBe('sending')
    expect(messages.value[0].body).toBe('Hello')

    // Resolve the insert
    const saved: Message = { id: 'srv-1', conversationId: 'c1', senderId: 'u1', type: 'text', body: 'Hello', media: null, createdAt: '2024-01-01T00:00:00Z', status: 'sent' }
    resolveInsert(saved)
    await sendPromise

    expect(messages.value[0].status).toBe('sent')
    expect(messages.value[0].id).toBe('srv-1')
  })

  it('should set message status to "failed" when insert throws', async () => {
    mockInsertMessage.mockRejectedValue(new Error('Insert failed'))

    const { useChat } = await import('../use-chat')
    const { messages, sendTextMessage } = useChat()

    await expect(sendTextMessage('c1', 'u1', 'Hi')).rejects.toThrow('Insert failed')

    expect(messages.value).toHaveLength(1)
    expect(messages.value[0].status).toBe('failed')
  })

  it('should use nanoid to generate a local id for optimistic message', async () => {
    const saved: Message = { id: 'srv-1', conversationId: 'c1', senderId: 'u1', type: 'text', body: 'Hi', media: null, createdAt: '2024-01-01T00:00:00Z', status: 'sent' }
    mockInsertMessage.mockResolvedValue(saved)

    const { useChat } = await import('../use-chat')
    const { sendTextMessage } = useChat()

    await sendTextMessage('c1', 'u1', 'Hi')

    expect(mockNanoid).toHaveBeenCalled()
  })
})

// ─── retryFailedMessage ───────────────────────────────────────────────────────

describe('useChat — retryFailedMessage', () => {
  it('should do nothing when messageId is not found', async () => {
    const { useChat } = await import('../use-chat')
    const { messages, retryFailedMessage } = useChat()

    await retryFailedMessage('non-existent-id')

    expect(messages.value).toHaveLength(0)
    expect(mockInsertMessage).not.toHaveBeenCalled()
  })

  it('should retry send for an existing failed message', async () => {
    // First, create a failed message
    mockInsertMessage.mockRejectedValueOnce(new Error('First attempt failed'))
    const saved: Message = { id: 'srv-retry', conversationId: 'c1', senderId: 'u1', type: 'text', body: 'Retry me', media: null, createdAt: '2024-01-01T00:00:00Z', status: 'sent' }
    mockInsertMessage.mockResolvedValueOnce(saved)

    const { useChat } = await import('../use-chat')
    const { messages, sendTextMessage, retryFailedMessage } = useChat()

    await expect(sendTextMessage('c1', 'u1', 'Retry me')).rejects.toThrow()

    const failedId = messages.value[0].id
    expect(messages.value[0].status).toBe('failed')

    await retryFailedMessage(failedId)

    // The failed message gets a new optimistic entry and then the saved one
    const sentMsg = messages.value.find((m) => m.status === 'sent')
    expect(sentMsg).toBeDefined()
  })
})
