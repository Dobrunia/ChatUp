import { prisma } from '../../db/prisma';
import { TRPCError } from '@trpc/server';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { LIMITS } from '@chatup/shared/src/protocol';
import { MEDIA_LIMITS } from '../../config/constants';
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: config.s3.region,
  endpoint: config.s3.endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
});

export class MediaService {
  static async requestUploadUrl(userId: string, mime: string, size: number) {
    // Validate size depending on mime type
    const isImage = mime.startsWith('image/');
    const isVideo = mime.startsWith('video/');
    
    if (isImage && size > LIMITS.IMAGE_MAX_SIZE_MB * MEDIA_LIMITS.BYTES_IN_MB) {
      throw new TRPCError({ code: 'PAYLOAD_TOO_LARGE', message: 'Image too large' });
    }
    if (isVideo && size > LIMITS.VIDEO_MAX_SIZE_MB * MEDIA_LIMITS.BYTES_IN_MB) {
      throw new TRPCError({ code: 'PAYLOAD_TOO_LARGE', message: 'Video too large' });
    }
    if (size > LIMITS.FILE_MAX_SIZE_MB * MEDIA_LIMITS.BYTES_IN_MB) {
      throw new TRPCError({ code: 'PAYLOAD_TOO_LARGE', message: 'File too large' });
    }

    const key = `${userId}/${uuidv4()}`;

    const uploadCommand = new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      ContentType: mime,
      ContentLength: size,
    });
    const uploadUrl = await getSignedUrl(s3Client, uploadCommand, { expiresIn: MEDIA_LIMITS.PRESIGNED_UPLOAD_TTL_SECONDS });

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
    if (!attachment || attachment?.ownerId !== userId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Attachment not found' });
    }

    let fileExistsInS3 = false;
    try {
      await s3Client.send(new HeadObjectCommand({
        Bucket: config.s3.bucket,
        Key: attachment.key,
      }));
      fileExistsInS3 = true;
    } catch {
      fileExistsInS3 = false;
    }

    if (!fileExistsInS3) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'File not uploaded to S3' });
    }

    return prisma.attachment.update({
      where: { id: attachmentId },
      data: { status: 'READY' }
    });
  }

  static async getDownloadUrl(attachmentId: string, userId: string) {
    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment || attachment?.status !== 'READY') {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Attachment not ready or not found' });
    }

    const isOwner = attachment.ownerId === userId;
    if (!isOwner && attachment.messageId) {
      const message = await prisma.message.findUnique({ where: { id: attachment.messageId } });
      if (message) {
        const member = await prisma.dialogMember.findUnique({
          where: { dialogId_userId: { dialogId: message.dialogId, userId } }
        });
        if (!member) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
      }
    } else if (!isOwner) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
    }

    const downloadCommand = new GetObjectCommand({
      Bucket: config.s3.bucket,
      Key: attachment.key,
    });
    const downloadUrl = await getSignedUrl(s3Client, downloadCommand, { expiresIn: MEDIA_LIMITS.PRESIGNED_DOWNLOAD_TTL_SECONDS });
    return { downloadUrl };
  }
}
