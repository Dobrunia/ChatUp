import { protectedProcedure, router } from '../trpc/trpc';
import { z } from 'zod';
import { PushService } from '../domain/services/push.service';

const webPushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const pushRouter = router({
  registerWebSubscription: protectedProcedure
    .input(webPushSubscriptionSchema)
    .mutation(async ({ input, ctx }) => {
      await PushService.registerWebSubscription(ctx.user.userId, input);
      return { success: true };
    }),

  unregisterWebSubscription: protectedProcedure
    .input(z.object({ endpoint: z.string().url() }))
    .mutation(async ({ input, ctx }) => {
      await PushService.unregisterWebSubscription(ctx.user.userId, input.endpoint);
      return { success: true };
    }),
});
