import { Platform } from 'react-native';

const buildImageFileInfo = (uri: string) => {
  const filename = uri.split('/').pop() || 'image.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  return { filename, type };
};

export const buildImageFormData = async (uri: string): Promise<FormData> => {
  const { filename, type } = buildImageFileInfo(uri);
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    const normalizedBlob = blob.type ? blob : new Blob([blob], { type });
    formData.append('file', normalizedBlob, filename);
    return formData;
  }

  // @ts-ignore - React Native FormData expects specific object structure
  formData.append('file', { uri, name: filename, type });
  return formData;
};
