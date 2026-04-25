-- AlterTable
ALTER TABLE "Product" ADD COLUMN "deletedAt" DATETIME;

-- CreateIndex
CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt");
