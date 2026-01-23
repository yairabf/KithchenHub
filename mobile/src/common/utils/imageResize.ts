import { Image } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { IMAGE_CONSTRAINTS } from './imageConstraints';

export interface ResizedImageResult {
  uri: string;
  width: number;
  height: number;
  sizeBytes: number;
}

interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Retrieves the width and height of an image from its file URI.
 * @param uri - Local file URI of the image
 * @returns Promise resolving to image dimensions
 * @throws Error if dimensions cannot be read
 */
const getImageDimensions = (uri: string): Promise<ImageDimensions> => {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => reject(new Error('Unable to read image dimensions'))
    );
  });
};

/**
 * Calculates resize target dimensions to fit within max bounds while preserving aspect ratio.
 * @param dimensions - Original image width and height
 * @returns Resized dimensions or null if no resize needed (already within bounds)
 */
const calculateResizeTarget = (dimensions: ImageDimensions): ImageDimensions | null => {
  const maxDimension = IMAGE_CONSTRAINTS.maxDimension;
  const scaleFactor = Math.min(
    maxDimension / dimensions.width,
    maxDimension / dimensions.height,
    1
  );

  if (scaleFactor >= 1) {
    return null;
  }

  return {
    width: Math.round(dimensions.width * scaleFactor),
    height: Math.round(dimensions.height * scaleFactor),
  };
};

/**
 * Retrieves the file size in bytes for a local image file.
 * @param uri - Local file URI of the image
 * @returns Promise resolving to file size in bytes
 * @throws Error if file size cannot be determined
 */
const getImageFileSizeBytes = async (uri: string): Promise<number> => {
  const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });
  const size = fileInfo?.size ?? null;
  if (size === null) {
    throw new Error('Unable to determine image file size');
  }
  return size;
};

/**
 * Resize and validate a local image file before upload.
 * - Preserves aspect ratio
 * - Converts to JPEG
 * - Enforces max dimensions and file size
 */
export const resizeAndValidateImage = async (uri: string): Promise<ResizedImageResult> => {
  if (!uri || uri.trim().length === 0) {
    throw new Error('Image URI is required');
  }

  const dimensions = await getImageDimensions(uri);
  const resizeTarget = calculateResizeTarget(dimensions);
  const actions = resizeTarget ? [{ resize: resizeTarget }] : [];

  const resized = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: IMAGE_CONSTRAINTS.jpegQuality,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  const sizeBytes = await getImageFileSizeBytes(resized.uri);
  if (sizeBytes > IMAGE_CONSTRAINTS.maxBytes) {
    throw new Error('Image exceeds max file size');
  }

  return {
    uri: resized.uri,
    width: resized.width,
    height: resized.height,
    sizeBytes,
  };
};
