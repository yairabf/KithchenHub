import { buildRecipeImagePath, uploadRecipeImage } from './imageUploadService';
import { supabase } from './supabase';

jest.mock('./supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(),
    },
  },
}));

const mockStorageFrom = supabase.storage.from as jest.Mock;

describe('imageUploadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue('blob'),
    }) as jest.Mock;
  });

  describe('buildRecipeImagePath', () => {
    it('builds household-scoped recipe image path', () => {
      const path = buildRecipeImagePath({
        householdId: 'house-123',
        recipeId: 'recipe-456',
        fileName: 'photo.jpg',
      });

      expect(path).toBe('households/house-123/recipes/recipe-456/photo.jpg');
    });
  });

  describe.each([
    ['missing image uri', { imageUri: '', householdId: 'house', recipeId: 'recipe' }],
    ['missing household', { imageUri: 'file://x.jpg', householdId: '', recipeId: 'recipe' }],
    ['missing recipe id', { imageUri: 'file://x.jpg', householdId: 'house', recipeId: '' }],
  ])('validation: %s', (_label, params) => {
    it('throws validation error', async () => {
      await expect(uploadRecipeImage(params)).rejects.toThrow('Missing required');
    });
  });

  it('uploads image and returns signed URL', async () => {
    const upload = jest.fn().mockResolvedValue({ data: { path: 'path' }, error: null });
    const createSignedUrl = jest.fn().mockResolvedValue({
      data: { signedUrl: 'https://signed.example.com' },
      error: null,
    });
    mockStorageFrom.mockReturnValue({ upload, createSignedUrl });

    const result = await uploadRecipeImage({
      imageUri: 'file://resized.jpg',
      householdId: 'house-123',
      recipeId: 'recipe-456',
    });

    expect(upload).toHaveBeenCalled();
    expect(createSignedUrl).toHaveBeenCalled();
    expect(result.signedUrl).toBe('https://signed.example.com');
  });

  describe('error handling', () => {
    it('throws when upload fails with error message', async () => {
      const upload = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      });
      const createSignedUrl = jest.fn();
      mockStorageFrom.mockReturnValue({ upload, createSignedUrl });

      await expect(
        uploadRecipeImage({
          imageUri: 'file://resized.jpg',
          householdId: 'house-123',
          recipeId: 'recipe-456',
        })
      ).rejects.toThrow('Network error');
      expect(createSignedUrl).not.toHaveBeenCalled();
    });

    it('throws when upload fails without error message', async () => {
      const upload = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const createSignedUrl = jest.fn();
      mockStorageFrom.mockReturnValue({ upload, createSignedUrl });

      await expect(
        uploadRecipeImage({
          imageUri: 'file://resized.jpg',
          householdId: 'house-123',
          recipeId: 'recipe-456',
        })
      ).rejects.toThrow('Failed to upload recipe image');
      expect(createSignedUrl).not.toHaveBeenCalled();
    });

    it('throws when upload returns no path', async () => {
      const upload = jest.fn().mockResolvedValue({
        data: { path: null },
        error: null,
      });
      const createSignedUrl = jest.fn();
      mockStorageFrom.mockReturnValue({ upload, createSignedUrl });

      await expect(
        uploadRecipeImage({
          imageUri: 'file://resized.jpg',
          householdId: 'house-123',
          recipeId: 'recipe-456',
        })
      ).rejects.toThrow('Failed to upload recipe image');
      expect(createSignedUrl).not.toHaveBeenCalled();
    });

    it('throws when signed URL creation fails with error message', async () => {
      const upload = jest.fn().mockResolvedValue({
        data: { path: 'path' },
        error: null,
      });
      const createSignedUrl = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Auth error' },
      });
      mockStorageFrom.mockReturnValue({ upload, createSignedUrl });

      await expect(
        uploadRecipeImage({
          imageUri: 'file://resized.jpg',
          householdId: 'house-123',
          recipeId: 'recipe-456',
        })
      ).rejects.toThrow('Auth error');
    });

    it('throws when signed URL creation fails without error message', async () => {
      const upload = jest.fn().mockResolvedValue({
        data: { path: 'path' },
        error: null,
      });
      const createSignedUrl = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      mockStorageFrom.mockReturnValue({ upload, createSignedUrl });

      await expect(
        uploadRecipeImage({
          imageUri: 'file://resized.jpg',
          householdId: 'house-123',
          recipeId: 'recipe-456',
        })
      ).rejects.toThrow('Failed to create signed image URL');
    });

    it('throws when signed URL creation returns no signedUrl', async () => {
      const upload = jest.fn().mockResolvedValue({
        data: { path: 'path' },
        error: null,
      });
      const createSignedUrl = jest.fn().mockResolvedValue({
        data: { signedUrl: null },
        error: null,
      });
      mockStorageFrom.mockReturnValue({ upload, createSignedUrl });

      await expect(
        uploadRecipeImage({
          imageUri: 'file://resized.jpg',
          householdId: 'house-123',
          recipeId: 'recipe-456',
        })
      ).rejects.toThrow('Failed to create signed image URL');
    });
  });
});
