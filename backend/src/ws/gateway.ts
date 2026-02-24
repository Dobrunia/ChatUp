import WebSocket, { WebSocketServer } from 'ws';
import { verifyAccessToken } from '../auth/jwt';
import { WS_EVENTS } from '@chatup/shared/src/protocol';
import { IncomingMessage } from 'http';

export class WsGateway {
  private wss: WebSocketServer;
  // Map userId to set of active connections
  private connections = new Map<string, Set<WebSocket>>();

  constructor(server: any) {
    this.wss = new WebSocketServer({ server, maxPayload: 64 * 1024 });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req);
    });
  }

  private handleConnection(ws: WebSocket, req: IncomingMessage) {
    // Authenticate via query param or header (for WS usually query token)
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    try {
      const payload = verifyAccessToken(token);
      const userId = payload.userId;

      if (!this.connections.has(userId)) {
        this.connections.set(userId, new Set());
      }
      this.connections.get(userId)!.add(ws);

      ws.on('message', (data) => {
        this.handleMessage(userId, ws, data.toString());
      });

      ws.on('close', () => {
        this.connections.get(userId)?.delete(ws);
        if (this.connections.get(userId)?.size === 0) {
          this.connections.delete(userId);
        }
      });
    } catch (e) {
      ws.close(4001, 'Unauthorized');
    }
  }

  private handleMessage(userId: string, ws: WebSocket, message: string) {
    try {
      const parsed = JSON.parse(message);
      // Handle simple WS events like typing
      if (parsed.type === WS_EVENTS.CLIENT.TYPING_START) {
        // Forward to dialog members... (Requires DB lookup or cache)
      }
    } catch (e) {
      // Ignore invalid JSON
    }
  }

  public emitToUser(userId: string, event: string, payload: any) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      const data = JSON.stringify({ type: event, data: payload });
      for (const ws of userConnections) {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(data);
          } catch {
            userConnections.delete(ws);
          }
        }
      }
    }
  }

  public emitToUsers(userIds: string[], event: string, payload: any) {
    for (const userId of userIds) {
      this.emitToUser(userId, event, payload);
    }
  }
}

export let wsGateway: WsGateway;

export function initWsGateway(server: any) {
  wsGateway = new WsGateway(server);
}
