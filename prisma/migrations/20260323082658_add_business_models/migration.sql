/*
  Warnings:

  - You are about to drop the `password_reset_tokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "password_reset_tokens_userId_fkey";

-- DropTable
DROP TABLE "password_reset_tokens";

-- CreateTable
CREATE TABLE "package_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "packageTypeId" TEXT NOT NULL,
    "revenueBeforeVat" DECIMAL(18,2) NOT NULL,
    "costBeforeVat" DECIMAL(18,2) NOT NULL,
    "grossProfit" DECIMAL(18,2) NOT NULL,
    "vatAmount" DECIMAL(18,2) NOT NULL,
    "corporateTaxAmount" DECIMAL(18,2) NOT NULL,
    "netProfit" DECIMAL(18,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "vatRate" DECIMAL(5,4) NOT NULL,
    "corporateTaxRate" DECIMAL(5,4) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "package_types_code_key" ON "package_types"("code");

-- CreateIndex
CREATE INDEX "financial_records_userId_idx" ON "financial_records"("userId");

-- CreateIndex
CREATE INDEX "financial_records_packageTypeId_idx" ON "financial_records"("packageTypeId");

-- CreateIndex
CREATE INDEX "financial_records_recordDate_idx" ON "financial_records"("recordDate");

-- AddForeignKey
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_packageTypeId_fkey" FOREIGN KEY ("packageTypeId") REFERENCES "package_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
