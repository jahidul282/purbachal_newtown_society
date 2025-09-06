-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sectorNumber` VARCHAR(191) NOT NULL,
    `roadNumber` VARCHAR(191) NOT NULL,
    `plotNumber` VARCHAR(191) NOT NULL,
    `plotSize` VARCHAR(191) NOT NULL,
    `ownershipProofType` ENUM('LD_TAX_RECEIPT', 'MUTATION_PAPER', 'BDS_KHATIAN') NOT NULL,
    `ownershipProofFile` VARCHAR(191) NULL,
    `ownerNameEnglish` VARCHAR(191) NOT NULL,
    `ownerNameBangla` VARCHAR(191) NOT NULL,
    `contactNumber` VARCHAR(191) NOT NULL,
    `nidNumber` VARCHAR(191) NOT NULL,
    `presentAddress` VARCHAR(191) NOT NULL,
    `permanentAddress` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `ownerPhoto` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `paymentMethod` ENUM('BKASH', 'BANK') NOT NULL,
    `bkashTransactionId` VARCHAR(191) NULL,
    `bkashAccountNumber` VARCHAR(191) NULL,
    `bankAccountNumberFrom` VARCHAR(191) NULL,
    `paymentReceipt` VARCHAR(191) NULL,
    `membershipFee` INTEGER NOT NULL DEFAULT 1020,
    `agreeDataUse` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Post` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NULL,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `coverImage` VARCHAR(191) NULL,
    `authorId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Post_authorId_createdAt_idx`(`authorId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ManagementUser` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `photoUrl` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `role` ENUM('ADMIN', 'EDITOR', 'VIEWER') NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `created` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ManagementUser_email_key`(`email`),
    INDEX `ManagementUser_name_email_idx`(`name`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

