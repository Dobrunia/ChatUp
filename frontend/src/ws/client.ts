import { w3cwebsocket as W3CWebSocket } from 'websocket';
import { WS_EVENTS } from '@chatup/shared';
import { useChatStore } from '../stores/chat';
import { useDialogsStore } from '../stores/dialogs';
import { config } from '../config';
import type { MessageItem } from '../api/types';

class WsClient {
  private client: W3CWebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private dialogsRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  
  public connect() {
    if (
      this.client?.readyState === W3CWebSocket.OPEN ||
      this.client?.readyState === W3CWebSocket.CONNECTING
    ) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const wsUrl = `${config.ws.url}?token=${encodeURIComponent(token)}`;
    this.client = new W3CWebSocket(wsUrl);
    const dialogsStore = useDialogsStore();

    this.client.onopen = () => {
      console.log('WS Connected');
      dialogsStore.fetchDialogs().catch((error: unknown) => {
        if (import.meta.env.DEV) {
          console.debug('Failed to refresh dialogs after WS connect', error);
        }
      });
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };

    this.client.onmessage = (message) => {
      try {
        const payload = JSON.parse(message.data as string);
        this.handleEvent(payload);
      } catch (e) {
        console.error('WS Parse error', e);
      }
    };

    this.client.onclose = () => {
      console.log('WS Disconnected, retrying...');
      this.client = null;
      this.scheduleReconnect();
    };

    this.client.onerror = (err) => {
      console.error('WS Error', err);
    };
  }

  public disconnect() {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.dialogsRefreshTimer) {
      clearTimeout(this.dialogsRefreshTimer);
      this.dialogsRefreshTimer = null;
    }
  }

  private scheduleReconnect() {
    this.reconnectTimer ??= setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }

  private handleEvent(payload: { type: string; data: unknown }) {
    const chatStore = useChatStore();
    const dialogsStore = useDialogsStore();
    
    switch (payload.type) {
      case WS_EVENTS.SERVER.NEW_MESSAGE:
        chatStore.handleIncomingMessage(payload.data as MessageItem);
        this.dialogsRefreshTimer ??= setTimeout(() => {
          void dialogsStore.fetchDialogs().finally(() => {
            this.dialogsRefreshTimer = null;
          });
        }, 150);
        break;
      case WS_EVENTS.SERVER.DELIVERED_RECEIPT:
        chatStore.handleDeliveredReceipt(payload.data as { messageId?: string });
        break;
      case WS_EVENTS.SERVER.READ_RECEIPT:
        chatStore.handleReadReceipt(payload.data as { messageId?: string });
        break;
      case WS_EVENTS.SERVER.TYPING:
        break;
      case WS_EVENTS.SERVER.PRESENCE:
        break;
    }
  }
}

export const wsClient = new WsClient();
