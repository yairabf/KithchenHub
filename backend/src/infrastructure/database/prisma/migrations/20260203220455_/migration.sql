-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "category" TEXT,
ADD COLUMN     "cook_time" INTEGER;

-- AlterTable
ALTER TABLE "shopping_items" ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "shopping_lists" ADD COLUMN     "icon" TEXT;
