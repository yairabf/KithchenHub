import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ImportService } from '../services/import.service';
import { ImportRequestDto, ImportResponseDto } from '../dto/import.dto';
import { CurrentUserPayload } from '../../../common/decorators';
import { JwtAuthGuard } from '../../../common/guards';

describe('ImportController', () => {
  let controller: ImportController;

  const mockImportService = {
    executeImport: jest.fn(),
  };

  const mockUser: CurrentUserPayload = {
    userId: 'user-123',
    householdId: 'household-123',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImportController],
      providers: [
        {
          provide: ImportService,
          useValue: mockImportService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ImportController>(ImportController);
    module.get<ImportService>(ImportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('importData', () => {
    const mockImportRequest: ImportRequestDto = {
      recipes: [
        {
          id: 'local-recipe-1',
          title: 'Test Recipe',
          prepTime: 30,
          ingredients: [],
          instructions: [],
          imageUrl: null,
        },
      ],
      shoppingLists: [
        {
          id: 'local-list-1',
          name: 'Groceries',
          color: '#FF6B35',
          items: [],
        },
      ],
    };

    const mockSuccessResponse: ImportResponseDto = {
      created: 2,
      skipped: 0,
      mappings: {
        'local-recipe-1': 'server-recipe-1',
        'local-list-1': 'server-list-1',
      },
    };

    describe.each([
      [
        'user without household',
        { ...mockUser, householdId: undefined },
        mockImportRequest,
        null,
        BadRequestException,
        'should throw BadRequestException',
      ],
      [
        'user with empty household',
        { ...mockUser, householdId: '' },
        mockImportRequest,
        null,
        BadRequestException,
        'should throw BadRequestException',
      ],
      [
        'valid user and request',
        mockUser,
        mockImportRequest,
        mockSuccessResponse,
        null,
        'should return import response',
      ],
      [
        'valid user with empty recipes',
        mockUser,
        { recipes: [], shoppingLists: [] },
        { created: 0, skipped: 0, mappings: {} },
        null,
        'should return empty response',
      ],
      [
        'valid user with only recipes',
        mockUser,
        { recipes: mockImportRequest.recipes },
        {
          created: 1,
          skipped: 0,
          mappings: { 'local-recipe-1': 'server-recipe-1' },
        },
        null,
        'should import only recipes',
      ],
      [
        'valid user with only shopping lists',
        mockUser,
        { shoppingLists: mockImportRequest.shoppingLists },
        {
          created: 1,
          skipped: 0,
          mappings: { 'local-list-1': 'server-list-1' },
        },
        null,
        'should import only shopping lists',
      ],
    ])(
      'with %s',
      (
        _description,
        user,
        importRequest,
        expectedResponse,
        expectedError,
        testDescription,
      ) => {
        it(testDescription, async () => {
          if (expectedResponse) {
            mockImportService.executeImport.mockResolvedValue(expectedResponse);
          }

          if (expectedError) {
            await expect(
              controller.importData(user as CurrentUserPayload, importRequest),
            ).rejects.toThrow(expectedError);
            expect(mockImportService.executeImport).not.toHaveBeenCalled();
          } else {
            const result = await controller.importData(
              user as CurrentUserPayload,
              importRequest,
            );

            expect(result).toEqual(expectedResponse);
            expect(mockImportService.executeImport).toHaveBeenCalledWith(
              user.userId,
              user.householdId,
              importRequest,
            );
          }
        });
      },
    );

    it('should propagate service errors', async () => {
      const serviceError = new Error('Service error');
      mockImportService.executeImport.mockRejectedValue(serviceError);

      await expect(
        controller.importData(mockUser, mockImportRequest),
      ).rejects.toThrow('Service error');
    });
  });
});
