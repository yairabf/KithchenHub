import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma/prisma.service';
import { RecipeImagesService } from '../src/modules/recipes/services/recipe-images.service';
import { Logger } from '@nestjs/common';
import 'dotenv/config';
import axios from 'axios';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);
    const recipeImagesService = app.get(RecipeImagesService);
    const logger = new Logger('MigrationScript');

    logger.log('Starting migration of recipe images...');

    try {
        // 1. Find recipes that have an imageUrl but NO imageKey
        const recipesToMigrate = await prisma.recipe.findMany({
            where: {
                imageUrl: { not: null },
                imageKey: null,
            },
        });

        logger.log(`Found ${recipesToMigrate.length} recipes to migrate.`);

        let successCount = 0;
        let failCount = 0;

        for (const recipe of recipesToMigrate) {
            if (!recipe.imageUrl) continue;

            logger.log(`Migrating recipe ${recipe.id} - ${recipe.title} (${recipe.imageUrl})`);

            try {
                // 2. Download the image
                const response = await axios.get(recipe.imageUrl, {
                    responseType: 'arraybuffer'
                });

                const buffer = Buffer.from(response.data);
                const mimeType = response.headers['content-type'] || 'image/jpeg';

                logger.log(`Downloaded ${buffer.length} bytes, type: ${mimeType}`);

                // 3. Process and Upload using the existing service
                // This will:
                // - Resize/format to WebP
                // - Upload to S3 (main + thumb)
                // - Update DB (set imageKey, thumbKey, version, and clear imageUrl)
                await recipeImagesService.uploadRecipeImage(
                    recipe.id,
                    buffer,
                    mimeType,
                    recipe.householdId,
                );

                logger.log(`✓ Successfully migrated recipe ${recipe.id}`);
                successCount++;
            } catch (error: any) {
                logger.error(`✗ Failed to migrate recipe ${recipe.id}: ${error.message}`);
                failCount++;
            }
        }

        logger.log('Migration completed.');
        logger.log(`Success: ${successCount}`);
        logger.log(`Failed: ${failCount}`);
    } catch (error) {
        logger.error('Migration failed with fatal error', error);
    } finally {
        await app.close();
    }
}

bootstrap();
