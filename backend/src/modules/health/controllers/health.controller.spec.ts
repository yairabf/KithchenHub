import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from '../services/health.service';

describe('HealthController', () => {
    let controller: HealthController;
    let healthService: HealthService;

    const mockHealthService = {
        checkLiveness: jest.fn(),
        checkReadiness: jest.fn(),
        checkDetailed: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
            providers: [
                {
                    provide: HealthService,
                    useValue: mockHealthService,
                },
            ],
        }).compile();

        controller = module.get<HealthController>(HealthController);
        healthService = module.get<HealthService>(HealthService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('checkHealth', () => {
        it('should return liveness result', async () => {
            const expectedResult = { status: 'healthy', timestamp: '2023-01-01' };
            mockHealthService.checkLiveness.mockResolvedValue(expectedResult);

            const result = await controller.checkHealth();

            expect(result).toBe(expectedResult);
            expect(healthService.checkLiveness).toHaveBeenCalled();
        });
    });

    describe('checkLiveness', () => {
        it('should return liveness result', async () => {
            const expectedResult = { status: 'healthy', timestamp: '2023-01-01' };
            mockHealthService.checkLiveness.mockResolvedValue(expectedResult);

            const result = await controller.checkLiveness();

            expect(result).toBe(expectedResult);
            expect(healthService.checkLiveness).toHaveBeenCalled();
        });
    });

    describe('checkReadiness', () => {
        it('should return readiness result', async () => {
            const expectedResult = {
                status: 'healthy',
                timestamp: '2023-01-01',
                checks: { database: { status: 'up' } }
            };
            mockHealthService.checkReadiness.mockResolvedValue(expectedResult);

            const result = await controller.checkReadiness();

            expect(result).toBe(expectedResult);
            expect(healthService.checkReadiness).toHaveBeenCalled();
        });
    });

    describe('checkDetailed', () => {
        it('should return detailed result', async () => {
            const expectedResult = {
                status: 'healthy',
                timestamp: '2023-01-01',
                uptime: 100,
                version: '1.0.0',
                checks: { database: { status: 'up' }, memory: { used: 100, total: 200, percentage: 50 } }
            };
            mockHealthService.checkDetailed.mockResolvedValue(expectedResult);

            const result = await controller.checkDetailed();

            expect(result).toBe(expectedResult);
            expect(healthService.checkDetailed).toHaveBeenCalled();
        });
    });
});
