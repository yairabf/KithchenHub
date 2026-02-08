import { Platform } from 'react-native';
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

/** React Native FormData file shape for multipart upload (native only) */
interface RNFormDataFilePart {
  uri: string;
  type: string;
  name: string;
}

const RECIPE_IMAGE_FILENAME = 'recipe-image.jpg';

/**
 * Builds the file field for multipart upload. On web, FormData expects a Blob/File;
 * on React Native, the { uri, type, name } shape is used.
 */
async function getFilePartForFormData(imageUri: string): Promise<Blob | RNFormDataFilePart> {
  if (Platform.OS === 'web') {
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image for upload: ${response.status}`);
    }
    return await response.blob();
  }
  return {
    uri: imageUri,
    type: 'image/jpeg',
    name: RECIPE_IMAGE_FILENAME,
  };
}

/**
 * Uploads a recipe image to the backend.
 */
export const uploadRecipeImage = async (
  params: UploadRecipeImageParams
): Promise<UploadedImageResult> => {
  if (!params.imageUri) throw new Error('Missing image URI');
  if (!params.recipeId) throw new Error('Missing recipe ID');

  const filePart = await getFilePartForFormData(params.imageUri);
  const formData = new FormData();
  if (filePart instanceof Blob) {
    formData.append('file', filePart, RECIPE_IMAGE_FILENAME);
  } else {
    formData.append('file', filePart as unknown as Blob);
  }

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
