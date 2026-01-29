import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './infrastructure/database/prisma/prisma.module';
import { SupabaseModule } from './modules/supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { HouseholdsModule } from './modules/households/households.module';
import { ShoppingModule } from './modules/shopping/shopping.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { ChoresModule } from './modules/chores/chores.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ImportModule } from './modules/import/import.module';
import { HealthModule } from './modules/health/health.module';
import { TransformInterceptor } from './common/interceptors';
import { RequestContextInterceptor } from './common/interceptors';
import { LoggingInterceptor } from './common/interceptors';
import { SentryExceptionFilter } from './common/filters';
import { JwtAuthGuard } from './common/guards';
import { DeprecationInterceptor } from './common/versioning';
import { VersionGuard } from './common/versioning';
import { LoggerModule } from './common/logger/logger.module';
import { MonitoringModule } from './common/monitoring/monitoring.module';

@Module({
  imports: [
    LoggerModule,
    MonitoringModule,
    PrismaModule,
    AuthModule,
    HouseholdsModule,
    ShoppingModule,
    RecipesModule,
    ChoresModule,
    DashboardModule,
    ImportModule,
    HealthModule,
    SupabaseModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: VersionGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestContextInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DeprecationInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: SentryExceptionFilter,
    },
  ],
})
export class AppModule {}
