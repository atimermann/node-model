-- CreateTable
CREATE TABLE `correiosTrackingOrder` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tracking` VARCHAR(255) NOT NULL,
    `data` LONGTEXT NULL,

    UNIQUE INDEX `correiostrackingorder_tracking_unique`(`tracking`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `costPrice` DECIMAL(10, 2) NOT NULL,
    `purchaseDate` DATE NOT NULL,
    `productId` INTEGER UNSIGNED NOT NULL,
    `tax` DECIMAL(8, 2) NULL,
    `tracking` VARCHAR(255) NULL,
    `tags` LONGTEXT NULL DEFAULT '{}',
    `origin` VARCHAR(255) NOT NULL DEFAULT '',
    `status` ENUM('transit', 'stock', 'installed', 'sold', 'lost', 'faulty', 'replaced', 'cancelled') NOT NULL DEFAULT 'transit',

    INDEX `inventory_productId_foreign`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `productCategoryId` INTEGER UNSIGNED NOT NULL,
    `brand` VARCHAR(255) NOT NULL DEFAULT '',

    UNIQUE INDEX `product_product_name_unique`(`name`),
    INDEX `product_productCategoryId_foreign`(`productCategoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productCategory` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `product_category_name_unique`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `knex_migrations` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `batch` INTEGER NULL,
    `migration_time` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `knex_migrations_lock` (
    `index` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `is_locked` INTEGER NULL,

    PRIMARY KEY (`index`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `inventory` ADD CONSTRAINT `inventory_productId_foreign` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `product` ADD CONSTRAINT `product_productCategoryId_foreign` FOREIGN KEY (`productCategoryId`) REFERENCES `productCategory`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
