import { Module } from '@nestjs/common';
import { HouseholdsController } from './controllers/households.controller';
import { InviteController } from './controllers/invite.controller';
import { HouseholdsService } from './services/households.service';
import { HouseholdsRepository } from './repositories/households.repository';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HouseholdsController, InviteController],
  providers: [HouseholdsService, HouseholdsRepository],
  exports: [HouseholdsService],
})
export class HouseholdsModule {}
