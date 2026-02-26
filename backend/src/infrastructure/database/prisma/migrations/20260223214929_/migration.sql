/*
  Warnings:

  - You are about to drop the column `cook_time` on the `recipes` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "catalog_item_aliases_alias_trgm_idx";

-- DropIndex
DROP INDEX "master_grocery_catalog_name_trgm_idx";

-- AlterTable
ALTER TABLE "recipes" DROP COLUMN "cook_time";
