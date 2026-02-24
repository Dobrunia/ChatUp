import { protectedProcedure, router } from '../trpc/trpc';
import { z } from 'zod';
import { MediaService } from '../domain/services/media.service';

export const mediaRouter = router({
  requestUploadUrl: protectedProcedure
    .input(z.object({
      mime: z.string(),
      size: z.number().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      return MediaService.requestUploadUrl(ctx.user.userId, input.mime, input.size);
    }),

  confirmUpload: protectedProcedure
    .input(z.object({ attachmentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return MediaService.confirmUpload(input.attachmentId, ctx.user.userId);
    }),

  getDownloadUrl: protectedProcedure
    .input(z.object({ attachmentId: z.string() }))
    .query(async ({ input }) => {
      return MediaService.getDownloadUrl(input.attachmentId);
    })
});
