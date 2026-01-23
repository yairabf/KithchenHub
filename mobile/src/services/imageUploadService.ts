import { supabase } from './supabase';
import { IMAGE_CONSTRAINTS } from '../common/utils/imageConstraints';

const BUCKET_NAME = 'household-uploads';
const SIGNED_URL_EXPIRATION_SECONDS = 60 * 60 * 24 * 365;

export interface UploadRecipeImageParams {
  imageUri: string;
  householdId: string;
  recipeId: string;
}

export interface UploadedImageResult {
  path: string;
  signedUrl: string;
}

/**
 * Builds the storage path for a recipe image in Supabase Storage.
 */
export const buildRecipeImagePath = ({
  householdId,
  recipeId,
  fileName,
}: {
  householdId: string;
  recipeId: string;
  fileName: string;
}): string => {
  return `households/${householdId}/recipes/${recipeId}/${fileName}`;
};

const createRecipeImageFileName = (timestamp: number): string => {
  return `${timestamp}.${IMAGE_CONSTRAINTS.outputExtension}`;
};

const toBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  return response.blob();
};

const assertRequiredParams = (params: UploadRecipeImageParams) => {
  if (!params.imageUri?.trim()) {
    throw new Error('Missing required image URI');
  }
  if (!params.householdId?.trim()) {
    throw new Error('Missing required householdId');
  }
  if (!params.recipeId?.trim()) {
    throw new Error('Missing required recipeId');
  }
};

/**
 * Uploads a resized JPEG image to Supabase Storage and returns a signed URL.
 */
export const uploadRecipeImage = async (
  params: UploadRecipeImageParams
): Promise<UploadedImageResult> => {
  assertRequiredParams(params);

  const fileName = createRecipeImageFileName(Date.now());
  const path = buildRecipeImagePath({
    householdId: params.householdId,
    recipeId: params.recipeId,
    fileName,
  });

  const storage = supabase.storage.from(BUCKET_NAME);
  const blob = await toBlob(params.imageUri);

  const { data: uploadData, error: uploadError } = await storage.upload(path, blob, {
    contentType: IMAGE_CONSTRAINTS.outputMimeType,
    upsert: true,
  });

  if (uploadError || !uploadData?.path) {
    throw new Error(uploadError?.message || 'Failed to upload recipe image');
  }

  const { data: signedData, error: signedError } = await storage.createSignedUrl(
    uploadData.path,
    SIGNED_URL_EXPIRATION_SECONDS
  );

  if (signedError || !signedData?.signedUrl) {
    throw new Error(signedError?.message || 'Failed to create signed image URL');
  }

  return {
    path: uploadData.path,
    signedUrl: signedData.signedUrl,
  };
};
