/*
  Warnings:

  - You are about to drop the column `colesProductId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `igaProductId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `store` on the `Product` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "offProductId" TEXT,
    "repurchaseIntervalDays" INTEGER NOT NULL DEFAULT 14,
    "lastPurchasedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);
INSERT INTO "new_Product" ("createdAt", "deletedAt", "id", "imageUrl", "lastPurchasedAt", "name", "repurchaseIntervalDays", "updatedAt") SELECT "createdAt", "deletedAt", "id", "imageUrl", "lastPurchasedAt", "name", "repurchaseIntervalDays", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_offProductId_key" ON "Product"("offProductId");
CREATE INDEX "Product_lastPurchasedAt_idx" ON "Product"("lastPurchasedAt");
CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
