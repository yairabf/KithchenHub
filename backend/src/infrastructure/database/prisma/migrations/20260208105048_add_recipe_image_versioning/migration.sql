-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "image_key" TEXT,
ADD COLUMN     "image_version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "thumb_key" TEXT;
