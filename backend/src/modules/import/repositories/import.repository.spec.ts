import { Test, TestingModule } from '@nestjs/testing';
import { ImportRepository } from './import.repository';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

describe('ImportRepository', () => {
    let repository: ImportRepository;
    let prismaService: PrismaService;

    const mockPrismaService = {
        importMapping: {
            findMany: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ImportRepository,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        repository = module.get<ImportRepository>(ImportRepository);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findMappingsForUser', () => {
        describe.each([
            [
                'empty source fields',
                'user-1',
                [],
                [],
                new Map<string, string>(),
                'should return empty map and not query database',
            ],
            [
                'no existing mappings',
                'user-1',
                ['recipe-1', 'list-1'],
                [],
                new Map<string, string>(),
                'should return empty map',
            ],
            [
                'single existing mapping',
                'user-1',
                ['recipe-1'],
                [{ sourceField: 'recipe-1', targetField: 'server-recipe-1' }],
                new Map([['recipe-1', 'server-recipe-1']]),
                'should return map with single entry',
            ],
            [
                'multiple existing mappings',
                'user-1',
                ['recipe-1', 'recipe-2', 'list-1'],
                [
                    { sourceField: 'recipe-1', targetField: 'server-recipe-1' },
                    { sourceField: 'recipe-2', targetField: 'server-recipe-2' },
                    { sourceField: 'list-1', targetField: 'server-list-1' },
                ],
                new Map([
                    ['recipe-1', 'server-recipe-1'],
                    ['recipe-2', 'server-recipe-2'],
                    ['list-1', 'server-list-1'],
                ]),
                'should return map with all mappings',
            ],
            [
                'partial existing mappings',
                'user-1',
                ['recipe-1', 'recipe-2', 'list-1'],
                [
                    { sourceField: 'recipe-1', targetField: 'server-recipe-1' },
                ],
                new Map([['recipe-1', 'server-recipe-1']]),
                'should return map with only existing mappings',
            ],
        ])(
            'with %s',
            (
                _description,
                userId,
                sourceFields,
                mockMappings,
                expectedMap,
                testDescription
            ) => {
                it(testDescription, async () => {
                    mockPrismaService.importMapping.findMany.mockResolvedValue(mockMappings);

                    const result = await repository.findMappingsForUser(userId, sourceFields);

                    expect(result).toEqual(expectedMap);

                    if (sourceFields.length === 0) {
                        expect(mockPrismaService.importMapping.findMany).not.toHaveBeenCalled();
                    } else {
                        expect(mockPrismaService.importMapping.findMany).toHaveBeenCalledWith({
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
                    }
                });
            }
        );

        it('should handle database errors gracefully', async () => {
            const dbError = new Error('Database connection failed');
            mockPrismaService.importMapping.findMany.mockRejectedValue(dbError);

            await expect(
                repository.findMappingsForUser('user-1', ['recipe-1'])
            ).rejects.toThrow('Database connection failed');
        });
    });
});
