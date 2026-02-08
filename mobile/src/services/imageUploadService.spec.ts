import { uploadRecipeImage, deleteRecipeImage } from './imageUploadService';
import { api } from './api';

jest.mock('./api', () => ({
  api: {
    upload: jest.fn(),
  },
}));

jest.mock('../common/utils/imageResize', () => ({
  resizeAndValidateImage: jest.fn().mockResolvedValue({
    uri: 'file://resized.jpg',
    width: 100,
    height: 100,
    sizeBytes: 1024,
  }),
}));

describe('imageUploadService', () => {
  const mockParams = {
    imageUri: 'file://test.jpg',
    householdId: 'household-123',
    recipeId: 'recipe-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadRecipeImage', () => {
    it('should upload image via backend API and return imageUrl', async () => {
      const mockResponse = {
        imageUrl: 'https://storage.example.com/image.jpg',
        imageKey: 'households/h1/recipes/r1/photo.webp',
      };

      (api.upload as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadRecipeImage(mockParams);

      expect(api.upload).toHaveBeenCalledWith(
        '/recipes/recipe-123/image',
        expect.any(FormData),
      );
      expect(result).toEqual({
        imageUrl: 'https://storage.example.com/image.jpg',
        imageKey: 'households/h1/recipes/r1/photo.webp',
      });
    });

    describe.each<[string, Record<string, string>, string]>([
      ['missing imageUri', { ...mockParams, imageUri: '' }, 'Missing image URI'],
      ['missing recipeId', { ...mockParams, recipeId: '' }, 'Missing recipe ID'],
    ])('validation: %s', (_label, params, expectedMessage) => {
      it(`should throw "${expectedMessage}"`, async () => {
        await expect(uploadRecipeImage(params)).rejects.toThrow(expectedMessage);
      });
    });

    it('should propagate API errors', async () => {
      const error = new Error('API Error');
      (api.upload as jest.Mock).mockRejectedValue(error);

      await expect(uploadRecipeImage(mockParams)).rejects.toThrow('API Error');
    });
  });

  describe('deleteRecipeImage', () => {
    it('should throw when deletion is not supported', async () => {
      await expect(
        deleteRecipeImage('households/h1/recipes/r1/photo.jpg')
      ).rejects.toThrow('not supported');
    });

    describe.each<[string, string]>([
      ['empty path', ''],
      ['whitespace path', '   '],
    ])('validation: %s', (_label, path) => {
      it('should throw Missing path', async () => {
        await expect(deleteRecipeImage(path)).rejects.toThrow('Missing path');
      });
    });
  });
});
