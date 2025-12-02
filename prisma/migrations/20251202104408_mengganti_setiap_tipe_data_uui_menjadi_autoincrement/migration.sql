/*
  Warnings:

  - The primary key for the `Business` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Business` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Consultation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Consultation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `File` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `File` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Permit` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Permit` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `businessId` on the `Consultation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `businessId` on the `File` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `businessId` on the `Permit` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Consultation" DROP CONSTRAINT "Consultation_businessId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_businessId_fkey";

-- DropForeignKey
ALTER TABLE "Permit" DROP CONSTRAINT "Permit_businessId_fkey";

-- AlterTable
ALTER TABLE "Business" DROP CONSTRAINT "Business_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Business_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Consultation" DROP CONSTRAINT "Consultation_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "businessId",
ADD COLUMN     "businessId" INTEGER NOT NULL,
ADD CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "File" DROP CONSTRAINT "File_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "businessId",
ADD COLUMN     "businessId" INTEGER NOT NULL,
ADD CONSTRAINT "File_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Permit" DROP CONSTRAINT "Permit_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "businessId",
ADD COLUMN     "businessId" INTEGER NOT NULL,
ADD CONSTRAINT "Permit_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Permit" ADD CONSTRAINT "Permit_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
