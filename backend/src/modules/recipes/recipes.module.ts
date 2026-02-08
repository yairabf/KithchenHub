import { Module } from '@nestjs/common';
import { RecipesController } from './controllers/recipes.controller';
import { RecipeImagesController } from './controllers/recipe-images.controller';
import { RecipesService } from './services/recipes.service';
import { RecipeImagesService } from './services/recipe-images.service';
import { ImageProcessingService } from './images/image-processing.service';
import { RecipesRepository } from './repositories/recipes.repository';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [RecipesController, RecipeImagesController],
  providers: [
    RecipesService,
    RecipesRepository,
    RecipeImagesService,
    ImageProcessingService,
  ],
  exports: [RecipesService],
})
export class RecipesModule {}
