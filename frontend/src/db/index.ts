import Dexie, { type Table } from 'dexie';

export interface OutgoingMessage {
  clientMessageId: string;
  dialogId: string;
  content: string;
  attachmentIds?: string[];
  createdAt: number;
  retryCount: number;
}

export interface AppMeta {
  key: string;
  value: string;
}

export class ChatUpDb extends Dexie {
  outgoingMessages!: Table<OutgoingMessage, string>; // string is for clientMessageId
  appMeta!: Table<AppMeta, string>;

  constructor() {
    super('ChatUpDatabase');
    this.version(2).stores({
      outgoingMessages: 'clientMessageId, dialogId, createdAt',
      appMeta: 'key'
    });
    this.version(1).stores({
      outgoingMessages: 'clientMessageId, dialogId, createdAt'
    });
  }
}

export const db = new ChatUpDb();
