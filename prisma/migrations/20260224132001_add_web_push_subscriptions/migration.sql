-- CreateTable
CREATE TABLE `WebPushSubscription` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `endpoint` VARCHAR(191) NOT NULL,
    `p256dh` VARCHAR(191) NOT NULL,
    `auth` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WebPushSubscription_endpoint_key`(`endpoint`),
    INDEX `WebPushSubscription_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `RefreshToken_expiresAt_idx` ON `RefreshToken`(`expiresAt`);

-- AddForeignKey
ALTER TABLE `WebPushSubscription` ADD CONSTRAINT `WebPushSubscription_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Attachment` RENAME INDEX `Attachment_messageId_fkey` TO `Attachment_messageId_idx`;

-- RenameIndex
ALTER TABLE `Attachment` RENAME INDEX `Attachment_ownerId_fkey` TO `Attachment_ownerId_idx`;

-- RenameIndex
ALTER TABLE `Receipt` RENAME INDEX `Receipt_userId_fkey` TO `Receipt_userId_idx`;

-- RenameIndex
ALTER TABLE `RefreshToken` RENAME INDEX `RefreshToken_userId_fkey` TO `RefreshToken_userId_idx`;
