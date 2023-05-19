-- AddForeignKey
ALTER TABLE `inventory` ADD CONSTRAINT `inventory_tracking_fkey` FOREIGN KEY (`tracking`) REFERENCES `correiosTrackingOrder`(`tracking`) ON DELETE SET NULL ON UPDATE CASCADE;
