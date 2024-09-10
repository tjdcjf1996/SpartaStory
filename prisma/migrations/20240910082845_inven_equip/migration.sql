-- CreateTable
CREATE TABLE `Users` (
    `userNo` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(191) NOT NULL,
    `userPw` VARCHAR(191) NOT NULL,
    `userName` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Users_userId_key`(`userId`),
    PRIMARY KEY (`userNo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Characters` (
    `characterNo` INTEGER NOT NULL AUTO_INCREMENT,
    `userNo` INTEGER NOT NULL,
    `characterName` VARCHAR(191) NOT NULL,
    `health` INTEGER NOT NULL DEFAULT 500,
    `power` INTEGER NOT NULL DEFAULT 100,
    `money` INTEGER NOT NULL DEFAULT 10000,

    UNIQUE INDEX `Characters_characterNo_key`(`characterNo`),
    UNIQUE INDEX `Characters_characterName_key`(`characterName`),
    PRIMARY KEY (`characterNo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Items` (
    `itemNo` INTEGER NOT NULL AUTO_INCREMENT,
    `itemName` VARCHAR(191) NOT NULL,
    `itemStat` JSON NOT NULL,
    `itemPrice` INTEGER NOT NULL,

    PRIMARY KEY (`itemNo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Inventories` (
    `inventoryNo` INTEGER NOT NULL,
    `items` JSON NOT NULL,

    UNIQUE INDEX `Inventories_inventoryNo_key`(`inventoryNo`),
    PRIMARY KEY (`inventoryNo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Equips` (
    `equipNo` INTEGER NOT NULL,
    `items` JSON NOT NULL,

    UNIQUE INDEX `Equips_equipNo_key`(`equipNo`),
    PRIMARY KEY (`equipNo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Characters` ADD CONSTRAINT `Characters_userNo_fkey` FOREIGN KEY (`userNo`) REFERENCES `Users`(`userNo`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inventories` ADD CONSTRAINT `Inventories_inventoryNo_fkey` FOREIGN KEY (`inventoryNo`) REFERENCES `Characters`(`characterNo`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Equips` ADD CONSTRAINT `Equips_equipNo_fkey` FOREIGN KEY (`equipNo`) REFERENCES `Characters`(`characterNo`) ON DELETE CASCADE ON UPDATE CASCADE;
