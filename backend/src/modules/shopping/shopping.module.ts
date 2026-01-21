import { Module } from '@nestjs/common';
import { ShoppingService } from './services/shopping.service';
import { ShoppingRepository } from './repositories/shopping.repository';
import {
  GroceriesController,
  ShoppingListsController,
  ShoppingItemsController,
} from './controllers';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    GroceriesController,
    ShoppingListsController,
    ShoppingItemsController,
  ],
  providers: [ShoppingService, ShoppingRepository],
  exports: [ShoppingService],
})
export class ShoppingModule {}
