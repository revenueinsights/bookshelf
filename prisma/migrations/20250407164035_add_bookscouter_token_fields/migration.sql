-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bookScouterToken" TEXT,
ADD COLUMN     "bookScouterTokenExpiry" TIMESTAMP(3);
