-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "store" TEXT NOT NULL,
    "colesProductId" TEXT,
    "igaProductId" TEXT,
    "repurchaseIntervalDays" INTEGER NOT NULL DEFAULT 14,
    "lastPurchasedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_colesProductId_key" ON "Product"("colesProductId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_igaProductId_key" ON "Product"("igaProductId");

-- CreateIndex
CREATE INDEX "Product_store_idx" ON "Product"("store");

-- CreateIndex
CREATE INDEX "Product_lastPurchasedAt_idx" ON "Product"("lastPurchasedAt");
