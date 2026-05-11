import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { RecipeImageSearchModal } from '../RecipeImageSearchModal';

const translate = (key: string) =>
  ({
    'form.webImageSearch.title': 'Search web images',
    'form.webImageSearch.close': 'Close',
    'form.webImageSearch.placeholder': 'Search images',
    'form.webImageSearch.usageNote': 'Images come from the web. Check usage rights before sharing.',
    'form.webImageSearch.loading': 'Searching images...',
    'form.webImageSearch.error': 'Image search failed',
    'form.webImageSearch.errorHint': 'Please try again.',
    'form.webImageSearch.startTitle': 'Search for a recipe photo',
    'form.webImageSearch.startHint': 'Type a dish name.',
    'form.webImageSearch.emptyTitle': 'No images found',
    'form.webImageSearch.emptyHint': 'Try another search.',
  })[key] ?? key;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: translate,
  }),
}));

describe('RecipeImageSearchModal', () => {
  it('searches and selects a web image result', async () => {
    const searchImages = jest.fn().mockResolvedValue([
      {
        id: 'omelet-1',
        title: 'Omelet photo',
        imageUrl: 'https://example.com/omelet.jpg',
        thumbnailUrl: 'https://example.com/omelet-thumb.jpg',
        sourceDisplayName: 'example.com',
      },
    ]);
    const onSelect = jest.fn();

    const screen = render(
      <RecipeImageSearchModal
        visible={true}
        initialQuery="omelet"
        onClose={jest.fn()}
        onSelect={onSelect}
        searchImages={searchImages}
      />,
    );

    await waitFor(() => {
      expect(searchImages).toHaveBeenCalledWith('omelet');
      expect(screen.getByText('Omelet photo')).toBeTruthy();
    }, { timeout: 1000 });

    fireEvent.press(screen.getByTestId('recipe-image-search-result-omelet-1'));

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: 'https://example.com/omelet.jpg',
      }),
    );
  });
});
