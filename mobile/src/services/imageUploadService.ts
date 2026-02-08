import { apiClient } from './api';

export interface UploadRecipeImageParams {
  imageUri: string;
  householdId: string;
  recipeId: string;
}

export interface UploadedImageResult {
  imageUrl: string;
  imagePath: string;
}

/** React Native FormData file shape for multipart upload */
interface RNFormDataFilePart {
  uri: string;
  type: string;
  name: string;
}

/**
 * Uploads a recipe image to the backend.
 */
export const uploadRecipeImage = async (
  params: UploadRecipeImageParams
): Promise<UploadedImageResult> => {
  if (!params.imageUri) throw new Error('Missing image URI');
  if (!params.recipeId) throw new Error('Missing recipe ID');

  const filePart: RNFormDataFilePart = {
    uri: params.imageUri,
    type: 'image/jpeg',
    name: 'recipe-image.jpg',
  };
  const formData = new FormData();
  formData.append('file', filePart as unknown as Blob);

  const response = await apiClient.post(
    `/recipes/${params.recipeId}/image`,
    formData,
    {
      transformRequest: (data, headers) => {
        // Axios on React Native needs this to prevent it from stringifying FormData
        return data;
      },
    }
  );

  return response.data;
};

/**
 * Deletes a recipe image (not implemented in backend yet, placeholder).
 * @param path - Storage path of the image to delete (required for future backend implementation).
 */
export const deleteRecipeImage = async (path: string): Promise<void> => {
  if (!path?.trim()) {
    throw new Error('Missing path');
  }
  // TODO: Implement backend endpoint for image deletion when available
  console.warn('deleteRecipeImage not implemented for backend storage yet');
};
