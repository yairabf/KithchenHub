import { Module } from '@nestjs/common';
import { ImportController } from './controllers/import.controller';
import { ImportService } from './services/import.service';
import { ImportRepository } from './repositories/import.repository';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ImportController],
    providers: [ImportService, ImportRepository],
    exports: [ImportService],
})
export class ImportModule { }
