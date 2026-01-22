import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

@Injectable()
export class ImportRepository {
    constructor(private prisma: PrismaService) { }
}
