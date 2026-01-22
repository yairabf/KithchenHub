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
     * Uses efficient query with direct userId filter and sourceField IN clause
     * 
     * Requires database index on userId and composite index on (userId, sourceField)
     * for optimal performance. The unique constraint @@unique([userId, sourceField])
     * automatically creates the necessary index.
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
                userId,
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
