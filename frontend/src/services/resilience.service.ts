import { db } from '../db';
import { trpc } from '../api';
import { useOnline } from '@vueuse/core';
import { watch } from 'vue';

export class ResilienceService {
  private processing = false;

  constructor() {
    const isOnline = useOnline();

    // Listen to offline -> online transitions
    watch(isOnline, (online) => {
      if (online) {
        this.processOutgoingQueue();
      }
    });
  }

  // Enqueue message when offline or before sending
  async enqueueMessage(dialogId: string, clientMessageId: string, content: string) {
    await db.outgoingMessages.put({
      clientMessageId,
      dialogId,
      content,
      createdAt: Date.now()
    });

    // Try to process immediately
    this.processOutgoingQueue();
  }

  // Process the queue
  async processOutgoingQueue() {
    if (this.processing) return;
    this.processing = true;

    try {
      const messages = await db.outgoingMessages.orderBy('createdAt').toArray();

      for (const msg of messages) {
        try {
          await trpc.message.send.mutate({
            dialogId: msg.dialogId,
            clientMessageId: msg.clientMessageId,
            content: msg.content
          });
          // On success, remove from queue
          await db.outgoingMessages.delete(msg.clientMessageId);
        } catch (e: any) {
          // If collision (200-equivalent was sent by trpc/prisma due to P2002),
          // TRPC will not throw an error if the server returned success.
          // If network error, we abort the queue processing to try again later.
          if (e.message?.includes('fetch failed') || e.message?.includes('Failed to fetch')) {
            break;
          }
          // If it's a fatal error (e.g. Forbidden), maybe we should remove it?
          // For MVP, we delete to avoid infinite loop on bad request.
          if (e.data?.httpStatus >= 400 && e.data?.httpStatus < 500) {
             await db.outgoingMessages.delete(msg.clientMessageId);
          }
        }
      }
    } finally {
      this.processing = false;
    }
  }

  // Restore state on app restart
  async restoreStateOnStart() {
    // Re-trigger processing on boot if we are online
    if (navigator.onLine) {
      await this.processOutgoingQueue();
    }
  }
}

export const resilienceService = new ResilienceService();
