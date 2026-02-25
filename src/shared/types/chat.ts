export type MessageType = 'text' | 'image' | 'audio'
export type MessageStatus = 'sending' | 'sent' | 'read' | 'failed'

export interface MediaMeta {
  url: string
  type: MessageType
  size: number
  duration?: number
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  type: MessageType
  body: string | null
  media: MediaMeta | null
  createdAt: string
  status: MessageStatus
}

export interface Conversation {
  id: string
  memberIds: [string, string]
  lastMessage: Message | null
  unreadCount: number
  updatedAt: string
}

export interface Profile {
  userId: string
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  notificationsEnabled: boolean
}

export interface PresenceState {
  userId: string
  isOnline: boolean
  updatedAt: string
}

export interface ConversationReadState {
  conversationId: string
  userId: string
  lastReadAt: string | null
}

export interface TypingEventPayload {
  conversationId: string
  userId: string
  state: 'start' | 'stop'
  sentAt: string
}

export interface RecordingEventPayload {
  conversationId: string
  userId: string
  state: 'start' | 'stop'
  sentAt: string
}
