import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

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

type GoogleImageSearchItem = {
  title?: string;
  link?: string;
  displayLink?: string;
  image?: {
    contextLink?: string;
    thumbnailLink?: string;
    width?: number;
    height?: number;
  };
};

type GoogleImageSearchResponse = {
  items?: GoogleImageSearchItem[];
};

const GOOGLE_CUSTOM_SEARCH_URL = 'https://www.googleapis.com/customsearch/v1';
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
    const apiKey = this.getConfigValue('GOOGLE_IMAGE_SEARCH_API_KEY');
    const cx = this.getConfigValue('GOOGLE_IMAGE_SEARCH_CX');
    const safe = this.getConfigValue('GOOGLE_IMAGE_SEARCH_SAFE') || 'active';

    if (!apiKey || !cx) {
      throw new ServiceUnavailableException(
        'Recipe image search is not configured',
      );
    }

    const response = await axios.get<GoogleImageSearchResponse>(
      GOOGLE_CUSTOM_SEARCH_URL,
      {
        params: {
          key: apiKey,
          cx,
          searchType: 'image',
          q: normalizedQuery,
          num: normalizedLimit,
          safe,
        },
      },
    );

    return (response.data.items ?? [])
      .filter((item): item is GoogleImageSearchItem & { link: string } =>
        Boolean(item.link),
      )
      .map((item, index) => ({
        id: `${index}-${this.hashUrl(item.link)}`,
        title: item.title?.trim() || normalizedQuery,
        imageUrl: item.link,
        thumbnailUrl: item.image?.thumbnailLink,
        sourceUrl: item.image?.contextLink,
        sourceDisplayName: item.displayLink,
        width: item.image?.width,
        height: item.image?.height,
      }));
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

  private hashUrl(url: string): string {
    let hash = 0;
    for (let index = 0; index < url.length; index += 1) {
      hash = (hash * 31 + url.charCodeAt(index)) >>> 0;
    }
    return hash.toString(36);
  }
}
