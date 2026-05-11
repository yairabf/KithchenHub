import { api } from '../../../services/api';

export type RecipeImageSearchResult = {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  sourceDisplayName?: string;
  width?: number;
  height?: number;
};

export async function searchRecipeImages(
  query: string,
  limit = 10,
): Promise<RecipeImageSearchResult[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return [];
  }

  const params = new URLSearchParams({
    q: normalizedQuery,
    limit: String(limit),
  });

  return api.get<RecipeImageSearchResult[]>(
    `/recipes/images/search?${params.toString()}`,
  );
}
