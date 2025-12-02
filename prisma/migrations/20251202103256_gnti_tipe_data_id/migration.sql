/*
  Warnings:

  - The `ownerId` column on the `Business` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `lawyerId` column on the `Business` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `lawyerId` column on the `Consultation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "Business" DROP CONSTRAINT "Business_lawyerId_fkey";

-- DropForeignKey
ALTER TABLE "Business" DROP CONSTRAINT "Business_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Consultation" DROP CONSTRAINT "Consultation_lawyerId_fkey";

-- AlterTable
ALTER TABLE "Business" DROP COLUMN "ownerId",
ADD COLUMN     "ownerId" INTEGER,
DROP COLUMN "lawyerId",
ADD COLUMN     "lawyerId" INTEGER;

-- AlterTable
ALTER TABLE "Consultation" DROP COLUMN "lawyerId",
ADD COLUMN     "lawyerId" INTEGER;

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
