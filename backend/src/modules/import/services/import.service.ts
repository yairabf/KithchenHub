import { Injectable } from '@nestjs/common';
import { ImportRepository } from '../repositories/import.repository';

@Injectable()
export class ImportService {
    constructor(private readonly importRepository: ImportRepository) { }
}
