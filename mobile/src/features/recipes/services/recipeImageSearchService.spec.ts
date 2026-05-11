import { searchRecipeImages } from './recipeImageSearchService';
import { api } from '../../../services/api';

jest.mock('../../../services/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

describe('searchRecipeImages', () => {
  const mockedApiGet = api.get as jest.Mock;

  beforeEach(() => {
    mockedApiGet.mockReset();
  });

  it('returns empty results without calling API for blank queries', async () => {
    await expect(searchRecipeImages('   ')).resolves.toEqual([]);
    expect(mockedApiGet).not.toHaveBeenCalled();
  });

  it('encodes the query and limit for the backend search endpoint', async () => {
    mockedApiGet.mockResolvedValue([
      {
        id: '1',
        title: 'Omelet',
        imageUrl: 'https://example.com/omelet.jpg',
      },
    ]);

    const results = await searchRecipeImages('omelet recipe', 6);

    expect(mockedApiGet).toHaveBeenCalledWith(
      '/recipes/images/search?q=omelet+recipe&limit=6',
    );
    expect(results).toEqual([
      {
        id: '1',
        title: 'Omelet',
        imageUrl: 'https://example.com/omelet.jpg',
      },
    ]);
  });
});
