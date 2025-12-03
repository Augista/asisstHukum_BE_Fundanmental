/*
  Warnings:

  - A unique constraint covering the columns `[resultFileId]` on the table `Consultation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN     "resultFileId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Consultation_resultFileId_key" ON "Consultation"("resultFileId");

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_resultFileId_fkey" FOREIGN KEY ("resultFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
