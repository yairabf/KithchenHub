import { Test, TestingModule } from '@nestjs/testing';
import { RecipeImagesController } from '../recipe-images.controller';
import { RecipeImagesService } from '../../services/recipe-images.service';
import { BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';

describe('RecipeImagesController', () => {
  let controller: RecipeImagesController;
  let service: RecipeImagesService;

  const mockRecipeImagesService = {
    uploadRecipeImage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecipeImagesController],
      providers: [
        {
          provide: RecipeImagesService,
          useValue: mockRecipeImagesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RecipeImagesController>(RecipeImagesController);
    service = module.get<RecipeImagesService>(RecipeImagesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadImage', () => {
    const mockId = 'recipe-123';
    const mockRequest = {
      user: { householdId: 'household-123' },
      file: jest.fn(),
    };

    it('should successfully upload an image', async () => {
      const mockBuffer = Buffer.from('fake-image');
      const mockFile = {
        mimetype: 'image/jpeg',
        toBuffer: jest.fn().mockResolvedValue(mockBuffer),
      };

      mockRequest.file.mockResolvedValue(mockFile);
      mockRecipeImagesService.uploadRecipeImage.mockResolvedValue({
        id: mockId,
        imageUrl: 'url',
      });

      const result = await controller.uploadImage(mockId, mockRequest);

      expect(mockRequest.file).toHaveBeenCalled();
      expect(mockFile.toBuffer).toHaveBeenCalled();
      expect(service.uploadRecipeImage).toHaveBeenCalledWith(
        mockId,
        mockBuffer,
        'image/jpeg',
        'household-123',
      );
      expect(result).toEqual({ id: mockId, imageUrl: 'url' });
    });

    it('should throw BadRequestException if no file is provided', async () => {
      mockRequest.file.mockResolvedValue(null);

      await expect(controller.uploadImage(mockId, mockRequest)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid mime types', async () => {
      const mockFile = {
        mimetype: 'text/plain',
        toBuffer: jest.fn(),
      };

      mockRequest.file.mockResolvedValue(mockFile);

      await expect(controller.uploadImage(mockId, mockRequest)).rejects.toThrow(
        BadRequestException,
      );
      expect(BadRequestException).toBeDefined();
    });

    it('should throw BadRequestException if file is too large', async () => {
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
      const mockFile = {
        mimetype: 'image/jpeg',
        toBuffer: jest.fn().mockResolvedValue(largeBuffer),
      };

      mockRequest.file.mockResolvedValue(mockFile);

      await expect(controller.uploadImage(mockId, mockRequest)).rejects.toThrow(
        'File too large. Max 5MB allowed.',
      );
    });
  });
});
