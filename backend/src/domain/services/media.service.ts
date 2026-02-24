import { prisma } from '../../db/prisma';
import { TRPCError } from '@trpc/server';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { LIMITS } from '@chatup/shared/src/protocol';

export class MediaService {
  static async requestUploadUrl(userId: string, mime: string, size: number) {
    // Validate size depending on mime type
    const isImage = mime.startsWith('image/');
    const isVideo = mime.startsWith('video/');
    
    if (isImage && size > LIMITS.IMAGE_MAX_SIZE_MB * 1024 * 1024) {
      throw new TRPCError({ code: 'PAYLOAD_TOO_LARGE', message: 'Image too large' });
    }
    if (isVideo && size > LIMITS.VIDEO_MAX_SIZE_MB * 1024 * 1024) {
      throw new TRPCError({ code: 'PAYLOAD_TOO_LARGE', message: 'Video too large' });
    }
    if (size > LIMITS.FILE_MAX_SIZE_MB * 1024 * 1024) {
      throw new TRPCError({ code: 'PAYLOAD_TOO_LARGE', message: 'File too large' });
    }

    const key = `${userId}/${uuidv4()}`;

    // Here we would use aws-sdk to generate a presigned URL
    // For MVP demonstration, we just return a fake signed URL pointing to S3 endpoint
    const uploadUrl = `${config.s3.endpoint}/${config.s3.bucket}/${key}?signed=true`;

    const attachment = await prisma.attachment.create({
      data: {
        key,
        size,
        mime,
        ownerId: userId,
        status: 'PENDING'
      }
    });

    return { uploadUrl, attachmentId: attachment.id, key };
  }

  static async confirmUpload(attachmentId: string, userId: string) {
    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment || attachment.ownerId !== userId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Attachment not found' });
    }

    // Check with S3 if the file actually exists
    // awsSdk.headObject(...)
    // Fake checking for MVP
    const fileExistsInS3 = true;

    if (!fileExistsInS3) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'File not uploaded to S3' });
    }

    return prisma.attachment.update({
      where: { id: attachmentId },
      data: { status: 'READY' }
    });
  }

  static async getDownloadUrl(attachmentId: string) {
    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment || attachment.status !== 'READY') {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Attachment not ready or not found' });
    }

    // return signed download url
    const downloadUrl = `${config.s3.endpoint}/${config.s3.bucket}/${attachment.key}?download=true`;
    return { downloadUrl };
  }
}
