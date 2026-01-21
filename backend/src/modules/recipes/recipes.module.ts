import { Module } from '@nestjs/common';
import { RecipesController } from './controllers/recipes.controller';
import { RecipesService } from './services/recipes.service';
import { RecipesRepository } from './repositories/recipes.repository';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RecipesController],
  providers: [RecipesService, RecipesRepository],
  exports: [RecipesService],
})
export class RecipesModule {}
