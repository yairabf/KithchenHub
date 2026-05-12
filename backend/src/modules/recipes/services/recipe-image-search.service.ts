import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

export type RecipeImageSearchResultDto = {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  sourceDisplayName?: string;
  width?: number;
  height?: number;
};

type PexelsPhoto = {
  id: number;
  width?: number;
  height?: number;
  url?: string;
  photographer?: string;
  src?: {
    original?: string;
    large2x?: string;
    large?: string;
    medium?: string;
    small?: string;
    tiny?: string;
  };
  alt?: string;
};

type PexelsSearchResponse = {
  photos?: PexelsPhoto[];
};

const PEXELS_SEARCH_URL = 'https://api.pexels.com/v1/search';
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 10;
const MAX_QUERY_LENGTH = 120;

@Injectable()
export class RecipeImageSearchService {
  constructor(private readonly configService: ConfigService) {}

  async searchImages(
    query: string | undefined,
    limit?: string | number,
  ): Promise<RecipeImageSearchResultDto[]> {
    const normalizedQuery = this.normalizeQuery(query);
    const normalizedLimit = this.normalizeLimit(limit);
    const apiKey = this.getConfigValue('PEXELS_API_KEY');

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Recipe image search is not configured',
      );
    }

    try {
      const response = await axios.get<PexelsSearchResponse>(
        PEXELS_SEARCH_URL,
        {
          headers: {
            Authorization: apiKey,
          },
          params: {
            query: normalizedQuery,
            per_page: normalizedLimit,
          },
        },
      );

      return (response.data.photos ?? [])
        .map((photo) => this.mapPexelsPhoto(photo, normalizedQuery))
        .filter((photo): photo is RecipeImageSearchResultDto => Boolean(photo));
    } catch (error) {
      throw this.toSearchUnavailableException(error);
    }
  }

  private mapPexelsPhoto(
    photo: PexelsPhoto,
    fallbackTitle: string,
  ): RecipeImageSearchResultDto | null {
    const imageUrl =
      photo.src?.large2x ??
      photo.src?.large ??
      photo.src?.original ??
      undefined;

    if (!imageUrl) {
      return null;
    }

    return {
      id: `pexels-${photo.id}`,
      title: photo.alt?.trim() || fallbackTitle,
      imageUrl,
      thumbnailUrl: photo.src?.medium ?? photo.src?.small ?? photo.src?.tiny,
      sourceUrl: photo.url,
      sourceDisplayName: photo.photographer
        ? `Pexels • ${photo.photographer}`
        : 'Pexels',
      width: photo.width,
      height: photo.height,
    };
  }

  private toSearchUnavailableException(
    error: unknown,
  ): ServiceUnavailableException {
    const isAxiosError =
      axios.isAxiosError(error) ||
      (typeof error === 'object' &&
        error !== null &&
        'isAxiosError' in error &&
        error.isAxiosError === true);

    if (isAxiosError) {
      const status = (error as AxiosError).response?.status;
      if (status === 401 || status === 403) {
        return new ServiceUnavailableException(
          'Image search is temporarily unavailable. Please check Pexels API key configuration.',
        );
      }
    }

    return new ServiceUnavailableException(
      'Image search is temporarily unavailable. Please try again later.',
    );
  }

  private normalizeQuery(query: string | undefined): string {
    const trimmed = query?.trim();
    if (!trimmed) {
      throw new BadRequestException('Search query is required');
    }

    return trimmed.slice(0, MAX_QUERY_LENGTH);
  }

  private normalizeLimit(limit?: string | number): number {
    const parsed = Number(limit ?? DEFAULT_LIMIT);
    if (!Number.isFinite(parsed)) {
      return DEFAULT_LIMIT;
    }

    return Math.min(Math.max(Math.trunc(parsed), 1), MAX_LIMIT);
  }

  private getConfigValue(key: string): string | undefined {
    return this.configService.get<string>(key) ?? process.env[key];
  }
}
