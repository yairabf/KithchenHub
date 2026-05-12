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
      PEXELS_API_KEY: 'pexels-key',
    });

    await expect(service.searchImages('   ')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('returns service unavailable when Pexels image search is not configured', async () => {
    const service = buildService();

    await expect(service.searchImages('omelet')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('clamps limit and maps Pexels image results', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        photos: [
          {
            id: 123,
            width: 1200,
            height: 800,
            url: 'https://www.pexels.com/photo/fluffy-omelet-123/',
            photographer: 'Jane Cook',
            alt: 'Fluffy omelet on a plate',
            src: {
              original: 'https://images.pexels.com/photos/123/original.jpeg',
              large2x: 'https://images.pexels.com/photos/123/large2x.jpeg',
              medium: 'https://images.pexels.com/photos/123/medium.jpeg',
              small: 'https://images.pexels.com/photos/123/small.jpeg',
            },
          },
          {
            id: 456,
            photographer: 'Missing Image',
          },
        ],
      },
    });

    const service = buildService({
      PEXELS_API_KEY: 'pexels-key',
    });

    const results = await service.searchImages(' omelet recipe ', '25');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.pexels.com/v1/search',
      expect.objectContaining({
        headers: {
          Authorization: 'pexels-key',
        },
        params: {
          query: 'omelet recipe',
          per_page: 10,
        },
      }),
    );
    expect(results).toEqual([
      expect.objectContaining({
        id: 'pexels-123',
        title: 'Fluffy omelet on a plate',
        imageUrl: 'https://images.pexels.com/photos/123/large2x.jpeg',
        thumbnailUrl: 'https://images.pexels.com/photos/123/medium.jpeg',
        sourceUrl: 'https://www.pexels.com/photo/fluffy-omelet-123/',
        sourceDisplayName: 'Pexels • Jane Cook',
        width: 1200,
        height: 800,
      }),
    ]);
  });

  it('falls back to generic Pexels attribution when photographer is missing', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        photos: [
          {
            id: 789,
            src: {
              large: 'https://images.pexels.com/photos/789/large.jpeg',
              tiny: 'https://images.pexels.com/photos/789/tiny.jpeg',
            },
          },
        ],
      },
    });

    const service = buildService({
      PEXELS_API_KEY: 'pexels-key',
    });

    const results = await service.searchImages('pasta');

    expect(results[0]).toEqual(
      expect.objectContaining({
        id: 'pexels-789',
        title: 'pasta',
        imageUrl: 'https://images.pexels.com/photos/789/large.jpeg',
        thumbnailUrl: 'https://images.pexels.com/photos/789/tiny.jpeg',
        sourceDisplayName: 'Pexels',
      }),
    );
  });

  it('returns service unavailable with a safe message when Pexels rejects the request', async () => {
    mockedAxios.get.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 401,
        data: { error: 'Authorization field missing' },
      },
    });
    const service = buildService({
      PEXELS_API_KEY: 'pexels-key',
    });

    await expect(service.searchImages('pasta')).rejects.toThrow(
      /Pexels API key configuration/,
    );
  });
});
