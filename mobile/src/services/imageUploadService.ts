import { api } from './api';
import { resizeAndValidateImage } from '../common/utils/imageResize';
import { buildImageFormData } from '../common/utils/imageUpload';

export interface UploadRecipeImageParams {
  imageUri: string;
  householdId: string;
  recipeId: string;
}

export interface UploadedImageResult {
  imageUrl?: string | null;
  thumbUrl?: string | null;
  imageVersion?: number | null;
  imageUpdatedAt?: string | Date | null;
  imageKey?: string | null;
  thumbKey?: string | null;
}

const assertRequiredParams = (params: UploadRecipeImageParams) => {
  if (!params.imageUri?.trim()) {
    throw new Error('Missing image URI');
  }
  if (!params.householdId?.trim()) {
    throw new Error('Missing household ID');
  }
  if (!params.recipeId?.trim()) {
    throw new Error('Missing recipe ID');
  }
};

/**
 * Uploads a resized image to the backend and returns storage-backed URLs/metadata.
 */
export const uploadRecipeImage = async (
  params: UploadRecipeImageParams
): Promise<UploadedImageResult> => {
  assertRequiredParams(params);

  const resized = await resizeAndValidateImage(params.imageUri);
  const formData = await buildImageFormData(resized.uri);

  return api.upload<UploadedImageResult>(`/recipes/${params.recipeId}/image`, formData);
};

/**
 * @deprecated Recipe image deletion is not supported yet.
 * @param path - Storage path to delete.
 */
export const deleteRecipeImage = async (path: string): Promise<void> => {
  if (!path?.trim()) {
    throw new Error('Missing path');
  }
  throw new Error('Recipe image deletion is not supported yet.');
};
