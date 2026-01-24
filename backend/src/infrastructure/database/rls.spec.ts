import { Prisma, PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

/**
 * Row Level Security (RLS) Integration Tests
 * 
 * Verifies that the multi-tenant isolation policies correctly restrict access 
 * based on household membership.
 */
describe('Row Level Security (RLS) Integration Tests', () => {
    let prisma: PrismaClient;
    const storageBucketId = 'household-uploads';

    beforeAll(async () => {
        prisma = new PrismaClient();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    /**
     * Helper to create a complete test context for a household.
     */
    async function createTestContext(prefix: string) {
        const householdId = `${prefix}-h-${randomUUID().slice(0, 8)}`;
        const userId = randomUUID();

        await prisma.household.create({
            data: { id: householdId, name: `${prefix} Household` },
        });

        await prisma.user.create({
            data: { id: userId, householdId: householdId, email: `${prefix}-${userId}@test.com` },
        });

        return { householdId, userId };
    }

    /**
     * Helper to clean up test data.
     */
    async function cleanupContext(context: { householdId: string; userId: string }) {
        // Cascading deletes should handle most items if they depend on household/user
        await prisma.recipe.deleteMany({ where: { householdId: context.householdId } });
        await prisma.shoppingList.deleteMany({ where: { householdId: context.householdId } });
        await prisma.chore.deleteMany({ where: { householdId: context.householdId } });
        await prisma.user.deleteMany({ where: { id: context.userId } });
        await prisma.household.deleteMany({ where: { id: context.householdId } });
    }

    type StorageColumn = {
        column_name: string;
        is_nullable: 'YES' | 'NO';
        column_default: string | null;
        data_type: string;
        udt_name: string;
    };

    type StorageInsertPayload = {
        columns: string[];
        values: Array<unknown | Prisma.Sql>;
    };

    type StorageInsertParams = {
        bucketId: string;
        objectName: string;
        ownerId: string;
        objectId: string;
        now: Date;
    };

    type RawClient = PrismaClient | Prisma.TransactionClient;

    /**
     * Checks whether the Supabase storage schema is available in this database.
     */
    async function doesStorageSchemaExist(client: RawClient): Promise<boolean> {
        const [objects] = await client.$queryRaw<{ regclass: string | null }[]>`
            SELECT to_regclass('storage.objects')::text AS regclass;
        `;
        const [buckets] = await client.$queryRaw<{ regclass: string | null }[]>`
            SELECT to_regclass('storage.buckets')::text AS regclass;
        `;

        return Boolean(objects?.regclass) && Boolean(buckets?.regclass);
    }

    /**
     * Loads column metadata for storage.objects to build safe INSERT payloads.
     */
    async function fetchStorageColumns(client: RawClient): Promise<StorageColumn[]> {
        return client.$queryRaw<StorageColumn[]>`
            SELECT
                column_name,
                is_nullable,
                column_default,
                data_type,
                udt_name
            FROM information_schema.columns
            WHERE table_schema = 'storage' AND table_name = 'objects'
            ORDER BY ordinal_position;
        `;
    }

    /**
     * Ensures the household uploads bucket exists for storage RLS tests.
     */
    async function ensureHouseholdUploadsBucket(client: RawClient): Promise<void> {
        await client.$executeRaw`
            INSERT INTO storage.buckets (id, name, public)
            VALUES (${storageBucketId}, ${storageBucketId}, false)
            ON CONFLICT (id) DO NOTHING;
        `;
    }

    /**
     * Validates that the required storage RLS policies are present.
     */
    async function areHouseholdUploadsPoliciesPresent(client: RawClient): Promise<boolean> {
        const requiredPolicies = [
            'Household members can read their files',
            'Household members can upload files',
            'Household members can update their files',
            'Household members can delete their files',
        ];

        const rows = await client.$queryRaw<{ policyname: string }[]>`
            SELECT policyname
            FROM pg_policies
            WHERE schemaname = 'storage' AND tablename = 'objects';
        `;

        const policyNames = new Set(rows.map((row) => row.policyname));
        return requiredPolicies.every((policy) => policyNames.has(policy));
    }

    /**
     * Builds a storage object path scoped to the given household.
     */
    function buildObjectName(householdId: string, suffix: string): string {
        return `households/${householdId}/${suffix}`;
    }

    /**
     * Maps storage column metadata to representative values for inserts.
     */
    function buildColumnValue(
        column: StorageColumn | undefined,
        params: StorageInsertParams
    ): unknown | Prisma.Sql | null {
        if (!column) {
            return null;
        }

        switch (column.column_name) {
            case 'id':
                return Prisma.sql`${params.objectId}::uuid`;
            case 'bucket_id':
                return params.bucketId;
            case 'name':
                return params.objectName;
            case 'owner':
            case 'owner_id':
                return Prisma.sql`${params.ownerId}::uuid`;
            case 'created_at':
            case 'updated_at':
            case 'last_accessed_at':
                return params.now;
            case 'metadata':
                return {};
            default:
                break;
        }

        if (column.data_type.includes('timestamp')) {
            return params.now;
        }

        if (column.data_type === 'uuid' || column.udt_name === 'uuid') {
            return Prisma.sql`${randomUUID()}::uuid`;
        }

        if (column.data_type === 'jsonb') {
            return {};
        }

        if (column.data_type === 'text' || column.data_type === 'character varying') {
            return 'placeholder';
        }

        if (column.data_type === 'boolean') {
            return false;
        }

        if (['integer', 'bigint', 'smallint'].includes(column.data_type)) {
            return 0;
        }

        return null;
    }

    /**
     * Creates a payload builder for storage.objects inserts based on required columns.
     */
    function createStorageInsertPayloadBuilder(columns: StorageColumn[]) {
        const columnByName = new Map(columns.map((column) => [column.column_name, column]));
        const requiredColumnNames = columns
            .filter((column) => column.is_nullable === 'NO' && column.column_default === null)
            .map((column) => column.column_name);

        const optionalOwnerColumns = ['owner', 'owner_id'].filter((columnName) =>
            columnByName.has(columnName)
        );
        const insertColumnNames = Array.from(
            new Set([...requiredColumnNames, 'bucket_id', 'name', ...optionalOwnerColumns])
        );

        const insertColumns = insertColumnNames
            .map((columnName) => columnByName.get(columnName))
            .filter((column): column is StorageColumn => Boolean(column));

        if (insertColumns.length !== insertColumnNames.length) {
            return null;
        }

        return (params: StorageInsertParams): StorageInsertPayload | null => {
            const values = insertColumns.map((column) => buildColumnValue(column, params));
            if (values.some((value) => value === null || value === undefined)) {
                return null;
            }

            return {
                columns: insertColumns.map((column) => column.column_name),
                values,
            };
        };
    }

    /**
     * Builds a parameterized INSERT query for storage.objects.
     */
    function isPrismaSql(value: unknown): value is Prisma.Sql {
        return Boolean(
            value &&
            typeof value === 'object' &&
            'strings' in value &&
            'values' in value
        );
    }

    function buildStorageInsertQuery(payload: StorageInsertPayload): Prisma.Sql {
        const columnSql = Prisma.join(
            payload.columns.map((columnName) => Prisma.raw(`"${columnName}"`))
        );
        const valueSql = Prisma.join(
            payload.values.map((value) => (isPrismaSql(value) ? value : Prisma.sql`${value}`))
        );

        return Prisma.sql`INSERT INTO storage.objects (${columnSql}) VALUES (${valueSql})`;
    }

    /**
     * Sets the authenticated role and JWT claims for RLS testing.
     */
    async function runAsAuthenticatedUser(
        tx: Prisma.TransactionClient,
        userId: string
    ): Promise<void> {
        await tx.$executeRawUnsafe('SET LOCAL ROLE authenticated');
        await tx.$executeRawUnsafe(`SET LOCAL "request.jwt.claims" = '{"sub": "${userId}"}'`);
    }

    /**
     * Deletes test storage objects under the household rls-test prefix.
     */
    async function cleanupStorageObjects(householdId: string): Promise<void> {
        const prefix = `households/${householdId}/rls-test/`;
        await prisma.$executeRaw`
            DELETE FROM storage.objects
            WHERE bucket_id = ${storageBucketId}
              AND name LIKE ${`${prefix}%`};
        `;
    }

    /**
     * Parameterized tests for household-isolated entities.
     * Rule 8: Always parameterize tests.
     */
    describe.each([
        ['Recipe', 'recipe'],
        ['Shopping List', 'shoppingList'],
        ['Chore', 'chore'],
    ])('%s isolation', (label, collection) => {
        it(`should prevent cross-household access for ${label}`, async () => {
            const contextA = await createTestContext('a');
            const contextB = await createTestContext('b');

            // 1. Create data for both households (as admin)
            const itemA = await (prisma[collection] as any).create({
                data: {
                    householdId: contextA.householdId,
                    title: collection === 'shoppingList' ? undefined : `Item A ${label}`,
                    name: collection === 'shoppingList' ? `List A` : undefined,
                    ingredients: collection === 'recipe' ? [] : undefined,
                    instructions: collection === 'recipe' ? [] : undefined,
                },
            });

            const itemB = await (prisma[collection] as any).create({
                data: {
                    householdId: contextB.householdId,
                    title: collection === 'shoppingList' ? undefined : `Item B ${label}`,
                    name: collection === 'shoppingList' ? `List B` : undefined,
                    ingredients: collection === 'recipe' ? [] : undefined,
                    instructions: collection === 'recipe' ? [] : undefined,
                },
            });

            // 2. Verify RLS as User A
            await prisma.$transaction(async (tx) => {
                await tx.$executeRawUnsafe('SET LOCAL ROLE authenticated');
                await tx.$executeRawUnsafe(`SET LOCAL "request.jwt.claims" = '{"sub": "${contextA.userId}"}'`);

                // User A should see Item A
                const myItems = await (tx[collection] as any).findMany({
                    where: { householdId: contextA.householdId }
                });
                expect(myItems.map((i: any) => i.id)).toContain(itemA.id);

                // User A should NOT see Item B
                const otherItems = await (tx[collection] as any).findMany({
                    where: { householdId: contextB.householdId }
                });
                expect(otherItems.length).toBe(0);

                // User A should NOT be able to insert into Household B
                await expect((tx[collection] as any).create({
                    data: {
                        householdId: contextB.householdId,
                        title: collection === 'shoppingList' ? undefined : `Stolen ${label}`,
                        name: collection === 'shoppingList' ? `Stolen List` : undefined,
                        ingredients: collection === 'recipe' ? [] : undefined,
                        instructions: collection === 'recipe' ? [] : undefined,
                    }
                })).rejects.toThrow();
            });

            // Cleanup
            await cleanupContext(contextA);
            await cleanupContext(contextB);
        }, 30000);
    });

    /**
     * Soft-delete tests for household-isolated entities.
     * Validates that soft-deleted records are properly isolated and can be set via RLS.
     */
    describe.each([
        ['Recipe', 'recipe'],
        ['Shopping List', 'shoppingList'],
        ['Chore', 'chore'],
    ])('%s soft-delete', (label, collection) => {
        it(`should soft-delete ${label} and filter from active queries`, async () => {
            const context = await createTestContext('soft-delete');

            // 1. Create item as admin
            const item = await (prisma[collection] as any).create({
                data: {
                    householdId: context.householdId,
                    title: collection === 'shoppingList' ? undefined : `Test ${label}`,
                    name: collection === 'shoppingList' ? `Test List` : undefined,
                    ingredients: collection === 'recipe' ? [] : undefined,
                    instructions: collection === 'recipe' ? [] : undefined,
                },
            });

            // 2. Soft-delete as authenticated user
            await prisma.$transaction(async (tx) => {
                await tx.$executeRawUnsafe('SET LOCAL ROLE authenticated');
                await tx.$executeRawUnsafe(`SET LOCAL "request.jwt.claims" = '{"sub": "${context.userId}"}'`);

                await (tx[collection] as any).update({
                    where: { id: item.id },
                    data: { deletedAt: new Date() },
                });
            });

            // 3. Verify item is not returned in active queries
            const activeItems = await prisma[collection].findMany({
                where: { 
                    householdId: context.householdId,
                    deletedAt: null,
                },
            });
            expect(activeItems.map((i: any) => i.id)).not.toContain(item.id);

            // 4. Verify item exists with deletedAt set
            const deletedItem = await (prisma[collection] as any).findUnique({
                where: { id: item.id },
            });
            expect(deletedItem.deletedAt).not.toBeNull();

            // Cleanup
            await cleanupContext(context);
        }, 30000);

        it(`should prevent cross-household soft-delete for ${label}`, async () => {
            const contextA = await createTestContext('soft-del-a');
            const contextB = await createTestContext('soft-del-b');

            // 1. Create item in household B
            const itemB = await (prisma[collection] as any).create({
                data: {
                    householdId: contextB.householdId,
                    title: collection === 'shoppingList' ? undefined : `Item B ${label}`,
                    name: collection === 'shoppingList' ? `List B` : undefined,
                    ingredients: collection === 'recipe' ? [] : undefined,
                    instructions: collection === 'recipe' ? [] : undefined,
                },
            });

            // 2. Try to soft-delete as User A (should fail due to RLS)
            await expect(
                prisma.$transaction(async (tx) => {
                    await tx.$executeRawUnsafe('SET LOCAL ROLE authenticated');
                    await tx.$executeRawUnsafe(`SET LOCAL "request.jwt.claims" = '{"sub": "${contextA.userId}"}'`);

                    await (tx[collection] as any).update({
                        where: { id: itemB.id },
                        data: { deletedAt: new Date() },
                    });
                })
            ).rejects.toThrow();

            // 3. Verify item B is still active
            const itemStillActive = await (prisma[collection] as any).findUnique({
                where: { id: itemB.id },
            });
            expect(itemStillActive.deletedAt).toBeNull();

            // Cleanup
            await cleanupContext(contextA);
            await cleanupContext(contextB);
        }, 30000);
    });

    describe('Storage RLS for household uploads', () => {
        let storageAvailable = false;
        let buildInsertPayload: ((params: StorageInsertParams) => StorageInsertPayload | null) | null = null;
        let storageSkipReason: string | null = null;

        beforeAll(async () => {
            storageAvailable = await doesStorageSchemaExist(prisma);
            if (!storageAvailable) {
                storageSkipReason = 'storage schema not available';
                return;
            }

            const storageColumns = await fetchStorageColumns(prisma);
            buildInsertPayload = createStorageInsertPayloadBuilder(storageColumns);
            if (!buildInsertPayload) {
                storageAvailable = false;
                storageSkipReason = 'storage.objects columns missing for insert';
                return;
            }

            await ensureHouseholdUploadsBucket(prisma);
            const policiesPresent = await areHouseholdUploadsPoliciesPresent(prisma);
            if (!policiesPresent) {
                storageAvailable = false;
                storageSkipReason = 'required storage RLS policies not found';
                return;
            }

            const samplePayload = buildInsertPayload({
                bucketId: storageBucketId,
                objectName: buildObjectName('sample', `rls-test/${randomUUID()}.jpg`),
                ownerId: randomUUID(),
                objectId: randomUUID(),
                now: new Date(),
            });

            if (!samplePayload) {
                storageAvailable = false;
                buildInsertPayload = null;
                storageSkipReason = 'storage insert payload could not be built';
            }
        });

        function shouldRunStorageTests(): boolean {
            if (storageAvailable) {
                return true;
            }

            if (process.env.ALLOW_STORAGE_RLS_SKIP === 'true') {
                // eslint-disable-next-line no-console
                console.warn(`Storage RLS tests skipped: ${storageSkipReason ?? 'unknown reason'}`);
                return false;
            }

            throw new Error(
                `Storage RLS tests cannot run: ${storageSkipReason ?? 'unknown reason'}. ` +
                    'Apply storage policies or set ALLOW_STORAGE_RLS_SKIP=true to bypass.'
            );
        }

        async function insertStorageObject(
            client: RawClient,
            params: StorageInsertParams
        ): Promise<void> {
            const payload = buildInsertPayload?.(params);
            if (!payload) {
                throw new Error('Storage insert payload could not be built.');
            }

            await client.$executeRaw(buildStorageInsertQuery(payload));
        }

        async function insertStorageObjectAsUser(
            userId: string,
            objectName: string
        ): Promise<void> {
            const now = new Date();
            const params: StorageInsertParams = {
                bucketId: storageBucketId,
                objectName,
                ownerId: userId,
                objectId: randomUUID(),
                now,
            };

            await prisma.$transaction(async (tx) => {
                await runAsAuthenticatedUser(tx, userId);
                await insertStorageObject(tx, params);
            });
        }

        async function selectStorageObjectNamesAsUser(
            userId: string,
            objectName: string
        ): Promise<string[]> {
            return prisma.$transaction(async (tx) => {
                await runAsAuthenticatedUser(tx, userId);
                const rows = await tx.$queryRaw<{ name: string }[]>`
                    SELECT name
                    FROM storage.objects
                    WHERE bucket_id = ${storageBucketId}
                      AND name = ${objectName};
                `;
                return rows.map((row) => row.name);
            });
        }

        const insertCases = [
            {
                description: 'allows uploads to the user household folder',
                target: 'self',
                shouldSucceed: true,
            },
            {
                description: 'denies uploads to a different household folder',
                target: 'other',
                shouldSucceed: false,
            },
        ] as const;

        it.each(insertCases)('$description', async ({ target, shouldSucceed }) => {
            if (!shouldRunStorageTests() || !buildInsertPayload) {
                return;
            }

            const contextA = await createTestContext('storage-a');
            const contextB = await createTestContext('storage-b');
            const targetHouseholdId =
                target === 'self' ? contextA.householdId : contextB.householdId;
            const objectName = buildObjectName(
                targetHouseholdId,
                `rls-test/${randomUUID()}.jpg`
            );

            try {
                const insertPromise = insertStorageObjectAsUser(contextA.userId, objectName);
                if (shouldSucceed) {
                    await expect(insertPromise).resolves.not.toThrow();
                } else {
                    await expect(insertPromise).rejects.toThrow();
                }
            } finally {
                await cleanupStorageObjects(contextA.householdId);
                await cleanupStorageObjects(contextB.householdId);
                await cleanupContext(contextA);
                await cleanupContext(contextB);
            }
        }, 30000);

        const readCases = [
            {
                description: 'allows reads inside the user household folder',
                target: 'self',
                expectedCount: 1,
            },
            {
                description: 'denies reads from a different household folder',
                target: 'other',
                expectedCount: 0,
            },
        ] as const;

        it.each(readCases)('$description', async ({ target, expectedCount }) => {
            if (!shouldRunStorageTests() || !buildInsertPayload) {
                return;
            }

            const contextA = await createTestContext('storage-read-a');
            const contextB = await createTestContext('storage-read-b');
            const targetHouseholdId =
                target === 'self' ? contextA.householdId : contextB.householdId;
            const objectName = buildObjectName(
                targetHouseholdId,
                `rls-test/${randomUUID()}.jpg`
            );

            try {
                if (target === 'self') {
                    await insertStorageObjectAsUser(contextA.userId, objectName);
                } else {
                    await insertStorageObjectAsUser(contextB.userId, objectName);
                }

                const results = await selectStorageObjectNamesAsUser(
                    contextA.userId,
                    objectName
                );
                expect(results.length).toBe(expectedCount);
            } finally {
                await cleanupStorageObjects(contextA.householdId);
                await cleanupStorageObjects(contextB.householdId);
                await cleanupContext(contextA);
                await cleanupContext(contextB);
            }
        }, 30000);
    });
});
