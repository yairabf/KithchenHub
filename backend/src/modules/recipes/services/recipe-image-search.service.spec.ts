import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RecipeImageSearchService } from './recipe-image-search.service';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RecipeImageSearchService', () => {
  const buildService = (values: Record<string, string | undefined> = {}) => {
    const configService = {
      get: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService;

    return new RecipeImageSearchService(configService);
  };

  beforeEach(() => {
    mockedAxios.get.mockReset();
  });

  it('rejects empty search queries', async () => {
    const service = buildService({
      GOOGLE_IMAGE_SEARCH_API_KEY: 'key',
      GOOGLE_IMAGE_SEARCH_CX: 'cx',
    });

    await expect(service.searchImages('   ')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('returns service unavailable when Google image search is not configured', async () => {
    const service = buildService();

    await expect(service.searchImages('omelet')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('clamps limit and maps Google image results', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        items: [
          {
            title: 'Fluffy Omelet',
            link: 'https://images.example.com/omelet.jpg',
            displayLink: 'example.com',
            image: {
              contextLink: 'https://example.com/omelet',
              thumbnailLink: 'https://images.example.com/omelet-thumb.jpg',
              width: 1200,
              height: 800,
            },
          },
          {
            title: 'Missing image url',
          },
        ],
      },
    });

    const service = buildService({
      GOOGLE_IMAGE_SEARCH_API_KEY: 'key',
      GOOGLE_IMAGE_SEARCH_CX: 'cx',
      GOOGLE_IMAGE_SEARCH_SAFE: 'active',
    });

    const results = await service.searchImages(' omelet recipe ', '25');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://www.googleapis.com/customsearch/v1',
      expect.objectContaining({
        params: expect.objectContaining({
          key: 'key',
          cx: 'cx',
          searchType: 'image',
          q: 'omelet recipe',
          num: 10,
          safe: 'active',
        }),
      }),
    );
    expect(results).toEqual([
      expect.objectContaining({
        title: 'Fluffy Omelet',
        imageUrl: 'https://images.example.com/omelet.jpg',
        thumbnailUrl: 'https://images.example.com/omelet-thumb.jpg',
        sourceUrl: 'https://example.com/omelet',
        sourceDisplayName: 'example.com',
        width: 1200,
        height: 800,
      }),
    ]);
  });

  it('accepts Google Custom Search alias env names for Vercel configuration', async () => {
    mockedAxios.get.mockResolvedValue({ data: { items: [] } });
    const service = buildService({
      GOOGLE_CUSTOM_SEARCH_API_KEY: 'custom-key',
      GOOGLE_CUSTOM_SEARCH_ENGINE_ID: 'custom-cx',
    });

    await service.searchImages('pasta');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://www.googleapis.com/customsearch/v1',
      expect.objectContaining({
        params: expect.objectContaining({
          key: 'custom-key',
          cx: 'custom-cx',
        }),
      }),
    );
  });

  it('returns service unavailable with a safe message when Google rejects the request', async () => {
    mockedAxios.get.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 400,
        data: { error: { message: 'API key not valid' } },
      },
    });
    const service = buildService({
      GOOGLE_IMAGE_SEARCH_API_KEY: 'key',
      GOOGLE_IMAGE_SEARCH_CX: 'cx',
    });

    await expect(service.searchImages('pasta')).rejects.toThrow(
      /Image search is temporarily unavailable/,
    );
  });
});
