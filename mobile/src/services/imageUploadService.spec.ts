import { uploadRecipeImage, deleteRecipeImage } from './imageUploadService';
import { apiClient } from './api';

jest.mock('./api', () => ({
  apiClient: {
    post: jest.fn(),
  },
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
        data: {
          imageUrl: 'https://storage.example.com/image.jpg',
          imagePath: 'households/h1/recipes/r1/photo.jpg',
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await uploadRecipeImage(mockParams);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/recipes/recipe-123/image',
        expect.any(FormData),
        expect.any(Object)
      );
      expect(result).toEqual({
        imageUrl: 'https://storage.example.com/image.jpg',
        imagePath: 'households/h1/recipes/r1/photo.jpg',
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
      (apiClient.post as jest.Mock).mockRejectedValue(error);

      await expect(uploadRecipeImage(mockParams)).rejects.toThrow('API Error');
    });
  });

  describe('deleteRecipeImage', () => {
    it('should log warning when backend not implemented', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await deleteRecipeImage('households/h1/recipes/r1/photo.jpg');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('not implemented')
      );

      consoleSpy.mockRestore();
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
