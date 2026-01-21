import { Module } from '@nestjs/common';
import { HouseholdsController } from './controllers/households.controller';
import { HouseholdsService } from './services/households.service';
import { HouseholdsRepository } from './repositories/households.repository';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HouseholdsController],
  providers: [HouseholdsService, HouseholdsRepository],
  exports: [HouseholdsService],
})
export class HouseholdsModule {}
