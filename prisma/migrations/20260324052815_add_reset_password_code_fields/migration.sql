-- AlterTable
ALTER TABLE "users" ADD COLUMN     "resetPasswordCodeHash" TEXT,
ADD COLUMN     "resetPasswordExpiresAt" TIMESTAMP(3);
