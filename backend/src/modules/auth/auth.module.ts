import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AuthRepository } from './repositories/auth.repository';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';
import { UuidService } from '../../common/services/uuid.service';
import { loadConfiguration } from '../../config/configuration';

const config = loadConfiguration();

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: config.jwt.secret,
      signOptions: { expiresIn: config.jwt.expiresIn },
    } as any),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, UuidService],
  exports: [AuthService],
})
export class AuthModule { }
