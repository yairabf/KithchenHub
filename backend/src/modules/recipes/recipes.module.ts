import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RecipesController } from './controllers/recipes.controller';
import { RecipeImagesController } from './controllers/recipe-images.controller';
import { RecipesService } from './services/recipes.service';
import { RecipeImagesService } from './services/recipe-images.service';
import { ImageProcessingService } from './images/image-processing.service';
import { RecipeImageRateLimitService } from './services/recipe-image-rate-limit.service';
import { RecipeImageRateLimitGuard } from './guards/recipe-image-rate-limit.guard';
import { RecipesRepository } from './repositories/recipes.repository';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule, ConfigModule],
  controllers: [RecipesController, RecipeImagesController],
  providers: [
    RecipesService,
    RecipesRepository,
    RecipeImagesService,
    RecipeImageRateLimitService,
    RecipeImageRateLimitGuard,
    ImageProcessingService,
  ],
  exports: [RecipesService],
})
export class RecipesModule {}
