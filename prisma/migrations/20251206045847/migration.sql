/*
  Warnings:

  - You are about to drop the column `resultFileId` on the `Consultation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[consultationId]` on the table `FileResult` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Consultation" DROP CONSTRAINT "Consultation_resultFileId_fkey";

-- DropIndex
DROP INDEX "Consultation_resultFileId_key";

-- AlterTable
ALTER TABLE "Consultation" DROP COLUMN "resultFileId";

-- AlterTable
ALTER TABLE "FileResult" ADD COLUMN     "consultationId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "FileResult_consultationId_key" ON "FileResult"("consultationId");

-- AddForeignKey
ALTER TABLE "FileResult" ADD CONSTRAINT "FileResult_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
