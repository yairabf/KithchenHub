import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './infrastructure/database/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { HouseholdsModule } from './modules/households/households.module';
import { ShoppingModule } from './modules/shopping/shopping.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { ChoresModule } from './modules/chores/chores.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { TransformInterceptor } from './common/interceptors';
import { HttpExceptionFilter } from './common/filters';
import { JwtAuthGuard } from './common/guards';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    HouseholdsModule,
    ShoppingModule,
    RecipesModule,
    ChoresModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
