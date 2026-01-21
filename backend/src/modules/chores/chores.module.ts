import { Module } from '@nestjs/common';
import { ChoresController } from './controllers/chores.controller';
import { ChoresService } from './services/chores.service';
import { ChoresRepository } from './repositories/chores.repository';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChoresController],
  providers: [ChoresService, ChoresRepository],
  exports: [ChoresService],
})
export class ChoresModule {}
