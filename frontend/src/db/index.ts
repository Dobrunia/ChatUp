import Dexie, { type Table } from 'dexie';

export interface OutgoingMessage {
  clientMessageId: string;
  dialogId: string;
  content: string;
  attachments?: string[];
  createdAt: number;
}

export class ChatUpDb extends Dexie {
  outgoingMessages!: Table<OutgoingMessage, string>; // string is for clientMessageId

  constructor() {
    super('ChatUpDatabase');
    this.version(1).stores({
      outgoingMessages: 'clientMessageId, dialogId, createdAt'
    });
  }
}

export const db = new ChatUpDb();
