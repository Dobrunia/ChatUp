import { trpc } from '../api';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { useChatStore } from '../stores/chat';
import { useNetworkState } from '../composables/useNetworkState';
import { watch } from 'vue';

const MAX_RETRIES = 5;

class ResilienceService {
  private processingPromise: Promise<void> | null = null;
  private isOnline = true;

  public init() {
    const { isOnline } = useNetworkState();
    
    watch(isOnline, (online) => {
      this.isOnline = online;
      if (online) {
        this.processOutgoingQueue();
      }
    }, { immediate: true });
  }

  public async enqueueMessage(dialogId: string, content: string, attachmentIds: string[] = []) {
    const clientMessageId = uuidv4();
    const chatStore = useChatStore();

    chatStore.addOptimisticMessage({
      id: '',
      clientMessageId,
      dialogId,
      senderId: 'optimistic',
      content,
      createdAt: new Date(),
      deletedAt: null
    });

    await db.outgoingMessages.add({
      clientMessageId,
      dialogId,
      content,
      attachmentIds,
      createdAt: Date.now(),
      retryCount: 0
    });

    if (this.isOnline) {
      this.processOutgoingQueue();
    }
  }

  public processOutgoingQueue(): Promise<void> {
    if (this.processingPromise || !this.isOnline) {
      return this.processingPromise ?? Promise.resolve();
    }

    this.processingPromise = this._processQueue()
      .catch((error: unknown) => {
        if (import.meta.env.DEV) {
          console.debug('Outgoing queue processing failed', error);
        }
      })
      .finally(() => {
        this.processingPromise = null;
      });

    return this.processingPromise;
  }

  private async _processQueue() {
    const pendingMessages = await db.outgoingMessages.orderBy('createdAt').toArray();
    const chatStore = useChatStore();

    for (const msg of pendingMessages) {
      if (!this.isOnline) break;

      if (msg.retryCount >= MAX_RETRIES) {
        await db.outgoingMessages.delete(msg.clientMessageId);
        continue;
      }

      try {
        const result = await trpc.message.send.mutate({
          dialogId: msg.dialogId,
          content: msg.content,
          clientMessageId: msg.clientMessageId
        });

        await db.outgoingMessages.delete(msg.clientMessageId);
        chatStore.updateMessageStatus(msg.clientMessageId, { id: result.id });

      } catch (error: unknown) {
        const httpStatus = (error as any)?.data?.httpStatus as number | undefined;
        const isFatal = httpStatus !== undefined && httpStatus >= 400 && httpStatus < 500 && httpStatus !== 429;

        if (isFatal) {
          await db.outgoingMessages.delete(msg.clientMessageId);
        } else {
          await db.outgoingMessages.update(msg.clientMessageId, {
            retryCount: msg.retryCount + 1
          });
          break;
        }
      }
    }
  }

  public async restoreStateOnStart() {
    if (this.isOnline) {
      this.processOutgoingQueue();
    }
  }
}

export const resilienceService = new ResilienceService();
