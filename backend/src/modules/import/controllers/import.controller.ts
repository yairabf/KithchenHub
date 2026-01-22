import { Controller } from '@nestjs/common';
import { ImportService } from '../services/import.service';

@Controller('import')
export class ImportController {
    constructor(private readonly importService: ImportService) { }
}
