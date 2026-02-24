import { w3cwebsocket as W3CWebSocket } from 'websocket';
import { WS_EVENTS } from '@chatup/shared/src/protocol';
import { useAuthStore } from '../stores/auth';
import { useChatStore } from '../stores/chat';
import { config } from '../config';

class WsClient {
  private client: W3CWebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  
  public connect() {
    if (this.client && this.client.readyState === W3CWebSocket.OPEN) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const wsUrl = `${config.ws.url}?token=${encodeURIComponent(token)}`;
    this.client = new W3CWebSocket(wsUrl);

    this.client.onopen = () => {
      console.log('WS Connected');
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
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, 5000);
    }
  }

  private handleEvent(payload: { type: string; data: unknown }) {
    const chatStore = useChatStore();
    
    switch (payload.type) {
      case WS_EVENTS.SERVER.NEW_MESSAGE:
        chatStore.handleIncomingMessage(payload.data);
        break;
      case WS_EVENTS.SERVER.DELIVERED_RECEIPT:
        // Receipt model — MVP: log only, message status tracked separately
        console.log('Delivered receipt', payload.data);
        break;
      case WS_EVENTS.SERVER.READ_RECEIPT:
        console.log('Read receipt', payload.data);
        break;
      case WS_EVENTS.SERVER.TYPING:
        break;
      case WS_EVENTS.SERVER.PRESENCE:
        break;
    }
  }
}

export const wsClient = new WsClient();
