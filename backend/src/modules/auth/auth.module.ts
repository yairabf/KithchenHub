import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AuthRepository } from './repositories/auth.repository';
import { AuthCleanupService } from './services/auth-cleanup.service';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';
import { UuidService } from '../../common/services/uuid.service';
import { loadConfiguration } from '../../config/configuration';

/**
 * To enable scheduled idempotency key cleanup:
 * 1. Install @nestjs/schedule: npm install @nestjs/schedule
 * 2. Import ScheduleModule: import { ScheduleModule } from '@nestjs/schedule';
 * 3. Add to imports array: ScheduleModule.forRoot()
 * 4. Uncomment @Cron decorator in AuthCleanupService.handleScheduledCleanup()
 */
const config = loadConfiguration();

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        secret: config.jwt.secret,
        signOptions: { expiresIn: config.jwt.expiresIn },
      }),
    } as any),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, AuthCleanupService, UuidService],
  exports: [AuthService, AuthCleanupService, JwtModule],
})
export class AuthModule {}
