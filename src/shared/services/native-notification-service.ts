import { isTauri } from '@tauri-apps/api/core'
import {
  Importance,
  Visibility,
  channels,
  createChannel,
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification'
import { fetchProfile } from '../api/profile-api'
import type { MessageType } from '../types/chat'
import type { RealtimeMessageEvent } from '../api/realtime-api'

const MESSAGE_CHANNEL_ID = 'chat-messages'

const messageChannel = {
  id: MESSAGE_CHANNEL_ID,
  name: 'Chat messages',
  description: 'Incoming chat notifications',
  importance: Importance.High,
  visibility: Visibility.Private,
  lights: true,
  vibration: true,
} as const

let notificationBootstrapPromise: Promise<boolean> | null = null
let messageChannelReady = false

function isNativeNotificationRuntime(): boolean {
  return isTauri()
}

async function ensurePermission(): Promise<boolean> {
  if (await isPermissionGranted()) {
    return true
  }

  const permission = await requestPermission()
  return permission === 'granted'
}

async function ensureMessageChannel(): Promise<void> {
  try {
    const existingChannels = await channels()
    if (existingChannels.some((channel) => channel.id === MESSAGE_CHANNEL_ID)) {
      messageChannelReady = true
      return
    }
    await createChannel(messageChannel)
    messageChannelReady = true
  } catch {
    messageChannelReady = false
  }
}

export async function initNativeNotifications(): Promise<boolean> {
  if (!isNativeNotificationRuntime()) {
    return false
  }

  if (!notificationBootstrapPromise) {
    notificationBootstrapPromise = (async () => {
      const permissionGranted = await ensurePermission()
      if (!permissionGranted) {
        return false
      }

      await ensureMessageChannel()
      return true
    })().catch(() => {
      notificationBootstrapPromise = null
      return false
    })
  }

  return notificationBootstrapPromise
}

export function buildIncomingMessageNotificationBody(
  type: MessageType,
  body: string | null,
): string {
  const trimmed = body?.trim()

  if (type === 'text') {
    return trimmed || 'Новое сообщение'
  }
  if (type === 'image') {
    return 'Фото'
  }
  return 'Голосовое сообщение'
}

export function shouldNotifyForRealtimeMessage(
  currentUserId: string,
  activeConversationId: string | null,
  message: RealtimeMessageEvent,
): boolean {
  return (
    message.senderId !== currentUserId &&
    message.conversationId !== activeConversationId
  )
}

export async function notifyIncomingMessage(message: RealtimeMessageEvent): Promise<void> {
  const ready = await initNativeNotifications()
  if (!ready) {
    return
  }

  const senderProfile = await fetchProfile(message.senderId).catch(() => null)
  const title =
    senderProfile?.displayName?.trim() ||
    senderProfile?.username?.trim() ||
    'Новое сообщение'

  sendNotification({
    ...(messageChannelReady ? { channelId: MESSAGE_CHANNEL_ID } : {}),
    title,
    body: buildIncomingMessageNotificationBody(message.type, message.body),
    group: message.conversationId,
    autoCancel: true,
    extra: {
      conversationId: message.conversationId,
      messageId: message.id,
      senderId: message.senderId,
    },
  })
}
