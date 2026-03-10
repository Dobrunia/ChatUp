import { describe, expect, it } from 'vitest'
import {
  buildIncomingMessageNotificationBody,
  shouldNotifyForRealtimeMessage,
} from '../native-notification-service'
import type { RealtimeMessageEvent } from '../../api/realtime-api'

function createMessage(overrides: Partial<RealtimeMessageEvent> = {}): RealtimeMessageEvent {
  return {
    id: 'message-1',
    conversationId: 'conversation-1',
    senderId: 'peer-1',
    type: 'text',
    body: 'Привет',
    createdAt: '2026-03-10T12:00:00.000Z',
    ...overrides,
  }
}

describe('native-notification-service', () => {
  it('builds text notification body from trimmed message text', () => {
    expect(buildIncomingMessageNotificationBody('text', '  Привет  ')).toBe('Привет')
  })

  it('falls back to media labels for non-text messages', () => {
    expect(buildIncomingMessageNotificationBody('image', null)).toBe('Фото')
    expect(buildIncomingMessageNotificationBody('audio', null)).toBe('Голосовое сообщение')
  })

  it('does not notify for own realtime messages', () => {
    expect(
      shouldNotifyForRealtimeMessage('self-1', null, createMessage({ senderId: 'self-1' })),
    ).toBe(false)
  })

  it('does not notify for the currently open conversation', () => {
    expect(
      shouldNotifyForRealtimeMessage(
        'self-1',
        'conversation-1',
        createMessage({ senderId: 'peer-1' }),
      ),
    ).toBe(false)
  })

  it('notifies for external incoming messages in other conversations', () => {
    expect(
      shouldNotifyForRealtimeMessage(
        'self-1',
        'conversation-2',
        createMessage({ senderId: 'peer-1' }),
      ),
    ).toBe(true)
  })
})
