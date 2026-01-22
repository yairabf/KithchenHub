import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

/**
 * Repository for managing import-related database operations
 */
@Injectable()
export class ImportRepository {
    constructor(private prisma: PrismaService) { }

    /**
     * Retrieves existing import mappings for a user's source fields
     * Uses efficient query with proper indexing on batch.userId and mapping.sourceField
     * 
     * @param userId - The user ID to filter mappings by
     * @param sourceFields - Array of source field IDs to find mappings for
     * @returns Map of sourceField -> targetField mappings
     */
    async findMappingsForUser(userId: string, sourceFields: string[]): Promise<Map<string, string>> {
        if (sourceFields.length === 0) {
            return new Map<string, string>();
        }

        const mappings = await this.prisma.importMapping.findMany({
            where: {
                batch: {
                    userId,
                },
                sourceField: {
                    in: sourceFields,
                },
            },
            select: {
                sourceField: true,
                targetField: true,
            },
        });

        return new Map(mappings.map((mapping) => [mapping.sourceField, mapping.targetField]));
    }
}
