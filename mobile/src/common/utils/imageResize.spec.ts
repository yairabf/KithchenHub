import { Image } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { resizeAndValidateImage } from './imageResize';
import { IMAGE_CONSTRAINTS } from './imageConstraints';

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg' },
}));

jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn(),
}));

jest.mock('react-native', () => ({
  Image: { getSize: jest.fn() },
}));

const mockManipulateAsync = ImageManipulator.manipulateAsync as jest.Mock;
const mockGetInfoAsync = FileSystem.getInfoAsync as jest.Mock;
const mockGetSize = Image.getSize as jest.Mock;

describe('resizeAndValidateImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each([
    ['missing uri', '', 'Image URI is required'],
    ['empty uri', '   ', 'Image URI is required'],
  ])('validation: %s', (_label, uri, expectedMessage) => {
    it('throws validation error', async () => {
      await expect(resizeAndValidateImage(uri)).rejects.toThrow(expectedMessage);
    });
  });

  it('resizes when the image exceeds max dimensions', async () => {
    mockGetSize.mockImplementation((_uri, success) => success(2000, 1500));
    mockManipulateAsync.mockResolvedValue({
      uri: 'file://resized.jpg',
      width: 1600,
      height: 1200,
    });
    mockGetInfoAsync.mockResolvedValue({ size: 500000 });

    const result = await resizeAndValidateImage('file://original.jpg');

    expect(mockManipulateAsync).toHaveBeenCalledWith(
      'file://original.jpg',
      [{ resize: { width: 1600, height: 1200 } }],
      expect.objectContaining({
        compress: IMAGE_CONSTRAINTS.jpegQuality,
        format: ImageManipulator.SaveFormat.JPEG,
      })
    );
    expect(result).toEqual({
      uri: 'file://resized.jpg',
      width: 1600,
      height: 1200,
      sizeBytes: 500000,
    });
  });

  it('keeps original dimensions when already under limits', async () => {
    mockGetSize.mockImplementation((_uri, success) => success(800, 600));
    mockManipulateAsync.mockResolvedValue({
      uri: 'file://resized.jpg',
      width: 800,
      height: 600,
    });
    mockGetInfoAsync.mockResolvedValue({ size: 200000 });

    await resizeAndValidateImage('file://original.jpg');

    expect(mockManipulateAsync).toHaveBeenCalledWith(
      'file://original.jpg',
      [],
      expect.any(Object)
    );
  });

  it('throws when resized image exceeds max bytes', async () => {
    mockGetSize.mockImplementation((_uri, success) => success(1600, 1200));
    mockManipulateAsync.mockResolvedValue({
      uri: 'file://resized.jpg',
      width: 1600,
      height: 1200,
    });
    mockGetInfoAsync.mockResolvedValue({ size: IMAGE_CONSTRAINTS.maxBytes + 1 });

    await expect(resizeAndValidateImage('file://original.jpg')).rejects.toThrow(
      'Image exceeds max file size'
    );
  });

  it('throws when file size cannot be determined', async () => {
    mockGetSize.mockImplementation((_uri, success) => success(1200, 800));
    mockManipulateAsync.mockResolvedValue({
      uri: 'file://resized.jpg',
      width: 1024,
      height: 682,
    });
    mockGetInfoAsync.mockResolvedValue({ size: null });

    await expect(resizeAndValidateImage('file://original.jpg')).rejects.toThrow(
      'Unable to determine image file size'
    );
  });
});
