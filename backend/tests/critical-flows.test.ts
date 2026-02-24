import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TRPCError } from '@trpc/server';
import { prisma } from '../src/db/prisma';
import { DialogService } from '../src/domain/services/dialog.service';
import { MessageService } from '../src/domain/services/message.service';
import { AuthService } from '../src/domain/services/auth.service';

type MutablePrisma = {
  dialogMember: { findUnique: (...args: unknown[]) => Promise<unknown> };
  message: {
    create: (...args: unknown[]) => Promise<unknown>;
    findUnique: (...args: unknown[]) => Promise<unknown>;
  };
  refreshToken: { deleteMany: (...args: unknown[]) => Promise<unknown> };
};

const p = prisma as unknown as MutablePrisma;
const original = {
  dialogMemberFindUnique: p.dialogMember.findUnique,
  messageCreate: p.message.create,
  messageFindUnique: p.message.findUnique,
  refreshDeleteMany: p.refreshToken.deleteMany,
};

afterEach(() => {
  p.dialogMember.findUnique = original.dialogMemberFindUnique;
  p.message.create = original.messageCreate;
  p.message.findUnique = original.messageFindUnique;
  p.refreshToken.deleteMany = original.refreshDeleteMany;
});

describe('Critical MVP flows', () => {
  it('shoud enforce dialog access control for non-member user', async () => {
    p.dialogMember.findUnique = async () => null;

    await assert.rejects(
      async () => DialogService.assertMembership('dialog-1', 'user-1'),
      (err: unknown) =>
        err instanceof TRPCError &&
        err.code === 'FORBIDDEN' &&
        err.message.includes('Not a member')
    );
  });

  it('shoud allow dialog access for member user', async () => {
    p.dialogMember.findUnique = async () => ({ dialogId: 'dialog-1', userId: 'user-1' });

    const member = await DialogService.assertMembership('dialog-1', 'user-1');
    assert.ok(member);
  });

  it('shoud guarantee idempotent send with clientMessageId', async () => {
    const existingMessage = {
      id: 'msg-existing',
      dialogId: 'dialog-1',
      senderId: 'user-1',
      clientMessageId: '11111111-1111-1111-1111-111111111111',
      content: 'hello',
      createdAt: new Date(),
      deletedAt: null,
    };

    p.dialogMember.findUnique = async () => ({ dialogId: 'dialog-1', userId: 'user-1' });
    p.message.create = async () => {
      throw { code: 'P2002' };
    };
    p.message.findUnique = async () => existingMessage;

    const result = await MessageService.sendMessage({
      dialogId: 'dialog-1',
      senderId: 'user-1',
      clientMessageId: '11111111-1111-1111-1111-111111111111',
      content: 'hello',
    });

    assert.equal((result as { id: string }).id, 'msg-existing');
  });

  it('shoud throw INTERNAL_SERVER_ERROR when idempotency collision has no existing message', async () => {
    p.dialogMember.findUnique = async () => ({ dialogId: 'dialog-1', userId: 'user-1' });
    p.message.create = async () => {
      throw { code: 'P2002' };
    };
    p.message.findUnique = async () => null;

    await assert.rejects(
      async () =>
        MessageService.sendMessage({
          dialogId: 'dialog-1',
          senderId: 'user-1',
          clientMessageId: '11111111-1111-1111-1111-111111111111',
          content: 'hello',
        }),
      (err: unknown) => err instanceof TRPCError && err.code === 'INTERNAL_SERVER_ERROR'
    );
  });

  it('shoud revoke refresh token on logout flow', async () => {
    const calls: Array<{ where?: { token?: string; userId?: string } }> = [];
    p.refreshToken.deleteMany = async (args: unknown) => {
      calls.push(args as { where?: { token?: string; userId?: string } });
      return { count: 1 };
    };

    await AuthService.logout('user-42', 'refresh-token-42');

    assert.equal(calls.length, 1);
    assert.equal(calls[0].where?.userId, 'user-42');
    assert.equal(calls[0].where?.token, 'refresh-token-42');
  });

  it('shoud skip refresh token deletion on logout when token is missing', async () => {
    const calls: Array<{ where?: { token?: string; userId?: string } }> = [];
    p.refreshToken.deleteMany = async (args: unknown) => {
      calls.push(args as { where?: { token?: string; userId?: string } });
      return { count: 1 };
    };

    await AuthService.logout('user-42');

    assert.equal(calls.length, 0);
  });
});
