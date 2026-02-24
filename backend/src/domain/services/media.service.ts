import { prisma } from '../../db/prisma';
import { TRPCError } from '@trpc/server';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { ERROR_MESSAGES, LIMITS } from '@chatup/shared/src/protocol';
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
      throw new TRPCError({ code: 'PAYLOAD_TOO_LARGE', message: ERROR_MESSAGES.IMAGE_TOO_LARGE });
    }
    if (isVideo && size > LIMITS.VIDEO_MAX_SIZE_MB * MEDIA_LIMITS.BYTES_IN_MB) {
      throw new TRPCError({ code: 'PAYLOAD_TOO_LARGE', message: ERROR_MESSAGES.VIDEO_TOO_LARGE });
    }
    if (size > LIMITS.FILE_MAX_SIZE_MB * MEDIA_LIMITS.BYTES_IN_MB) {
      throw new TRPCError({ code: 'PAYLOAD_TOO_LARGE', message: ERROR_MESSAGES.FILE_TOO_LARGE });
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
      throw new TRPCError({ code: 'NOT_FOUND', message: ERROR_MESSAGES.ATTACHMENT_NOT_FOUND });
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
      throw new TRPCError({ code: 'BAD_REQUEST', message: ERROR_MESSAGES.ATTACHMENT_NOT_UPLOADED });
    }

    return prisma.attachment.update({
      where: { id: attachmentId },
      data: { status: 'READY' }
    });
  }

  static async getDownloadUrl(attachmentId: string, userId: string) {
    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment || attachment?.status !== 'READY') {
      throw new TRPCError({ code: 'NOT_FOUND', message: ERROR_MESSAGES.ATTACHMENT_NOT_READY });
    }

    const isOwner = attachment.ownerId === userId;
    if (!isOwner && attachment.messageId) {
      const message = await prisma.message.findUnique({ where: { id: attachment.messageId } });
      if (message) {
        const member = await prisma.dialogMember.findUnique({
          where: { dialogId_userId: { dialogId: message.dialogId, userId } }
        });
        if (!member) {
          throw new TRPCError({ code: 'FORBIDDEN', message: ERROR_MESSAGES.ACCESS_DENIED });
        }
      }
    } else if (!isOwner) {
      throw new TRPCError({ code: 'FORBIDDEN', message: ERROR_MESSAGES.ACCESS_DENIED });
    }

    const downloadCommand = new GetObjectCommand({
      Bucket: config.s3.bucket,
      Key: attachment.key,
    });
    const downloadUrl = await getSignedUrl(s3Client, downloadCommand, { expiresIn: MEDIA_LIMITS.PRESIGNED_DOWNLOAD_TTL_SECONDS });
    return { downloadUrl };
  }
}
