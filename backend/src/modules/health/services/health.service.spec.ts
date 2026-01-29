import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

describe('HealthService', () => {
    let service: HealthService;
    let prismaService: PrismaService;

    const mockPrismaService = {
        $queryRaw: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HealthService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<HealthService>(HealthService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('checkLiveness', () => {
        it('should return healthy status', async () => {
            const result = await service.checkLiveness();
            expect(result).toHaveProperty('status', 'healthy');
            expect(result).toHaveProperty('timestamp');
        });
    });

    describe('checkReadiness', () => {
        it('should return healthy when database is up', async () => {
            mockPrismaService.$queryRaw.mockResolvedValue([{ 1: 1 }]);

            const result = await service.checkReadiness();

            expect(result.status).toBe('healthy');
            expect(result.checks.database.status).toBe('up');
        });

        it('should return unhealthy when database is down', async () => {
            mockPrismaService.$queryRaw.mockRejectedValue(new Error('DB Error'));

            const result = await service.checkReadiness();

            expect(result.status).toBe('unhealthy');
            expect(result.checks.database.status).toBe('down');
        });
    });

    describe('checkDetailed', () => {
        it('should return healthy status with all checks passing', async () => {
            mockPrismaService.$queryRaw.mockResolvedValue([{ 1: 1 }]);

            // Spy on memory usage
            const memorySpy = jest.spyOn(process, 'memoryUsage').mockReturnValue({
                heapUsed: 50 * 1024 * 1024,
                heapTotal: 100 * 1024 * 1024,
                rss: 0,
                external: 0,
                arrayBuffers: 0
            });

            const result = await service.checkDetailed();

            expect(result.status).toBe('healthy');
            expect(result.checks.database.status).toBe('up');
            expect(result.checks.memory.percentage).toBe(50);
            expect(result).toHaveProperty('uptime');
            expect(result).toHaveProperty('version');

            memorySpy.mockRestore();
        });

        it('should return unhealthy if database is down', async () => {
            mockPrismaService.$queryRaw.mockRejectedValue(new Error('DB Error'));
            jest.spyOn(process, 'memoryUsage').mockReturnValue({
                heapUsed: 50 * 1024 * 1024,
                heapTotal: 100 * 1024 * 1024,
                rss: 0,
                external: 0,
                arrayBuffers: 0
            });

            const result = await service.checkDetailed();

            expect(result.status).toBe('unhealthy');
            expect(result.checks.database.status).toBe('down');
        });

        it('should return degraded if memory usage is high', async () => {
            mockPrismaService.$queryRaw.mockResolvedValue([{ 1: 1 }]);
            jest.spyOn(process, 'memoryUsage').mockReturnValue({
                heapUsed: 95 * 1024 * 1024,
                heapTotal: 100 * 1024 * 1024,
                rss: 0,
                external: 0,
                arrayBuffers: 0
            });

            const result = await service.checkDetailed();

            expect(result.status).toBe('degraded');
            expect(result.checks.memory.percentage).toBe(95);
        });
    });
});
