/**
 * One-off data migration: convert legacy recipe ingredient shape to canonical unit fields.
 * Run after deploying the new unit system. Safe to run multiple times (idempotent).
 *
 * Usage (from backend): npx ts-node -r tsconfig-paths/register src/infrastructure/database/scripts/migrate-recipe-units.ts
 */
import { PrismaClient } from '@prisma/client';
import {
  UnitCode,
  UNIT_TYPE_MAPPING,
} from '../../../modules/recipes/constants/units.constants';
import { ACTIVE_RECORDS_FILTER } from '../filters/soft-delete.filter';

const prisma = new PrismaClient();

type LegacyIngredient = {
  name: string;
  quantity?: number;
  unit?: string;
  quantityAmount?: number;
  quantityUnit?: string;
  quantityUnitType?: string;
  quantityModifier?: string;
};

function migrateIngredient(ing: LegacyIngredient): LegacyIngredient {
  if (
    ing.quantityAmount !== undefined &&
    ing.quantityUnit !== undefined &&
    ing.quantityUnitType !== undefined
  ) {
    return ing;
  }

  const newIng: LegacyIngredient = { ...ing };

  if (ing.quantity !== undefined) {
    newIng.quantityAmount = ing.quantity;
  }

  if (ing.unit) {
    const matchedUnit = (Object.values(UnitCode) as string[]).find(
      (code) => code.toLowerCase() === String(ing.unit).toLowerCase(),
    );

    if (matchedUnit) {
      newIng.quantityUnit = matchedUnit;
      newIng.quantityUnitType = UNIT_TYPE_MAPPING[matchedUnit as UnitCode];
    } else {
      newIng.quantityModifier = ing.unit;
    }
  }

  return newIng;
}

const BATCH_SIZE = 100;

async function migrateRecipeUnits(): Promise<void> {
  let offset = 0;
  let totalMigrated = 0;

  while (true) {
    const batch = await prisma.recipe.findMany({
      where: ACTIVE_RECORDS_FILTER,
      skip: offset,
      take: BATCH_SIZE,
      orderBy: { id: 'asc' },
    });

    if (batch.length === 0) {
      break;
    }

    for (const recipe of batch) {
      const ingredients = recipe.ingredients as LegacyIngredient[] | null;

      if (!Array.isArray(ingredients)) {
        continue;
      }

      const migratedIngredients = ingredients.map(migrateIngredient);

      await prisma.recipe.update({
        where: { id: recipe.id },
        data: { ingredients: migratedIngredients as unknown as object },
      });
      totalMigrated += 1;
    }

    offset += BATCH_SIZE;
    console.log(`Migrated batch: ${totalMigrated} recipes so far.`);
  }

  console.log(`Migration complete. Total recipes migrated: ${totalMigrated}`);
}

migrateRecipeUnits()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
