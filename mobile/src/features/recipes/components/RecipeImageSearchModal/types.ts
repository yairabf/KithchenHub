import type { RecipeImageSearchResult } from '../../services/recipeImageSearchService';

export type RecipeImageSearchModalProps = {
  visible: boolean;
  initialQuery?: string;
  isRtl?: boolean;
  onClose: () => void;
  onSelect: (result: RecipeImageSearchResult) => void;
  searchImages?: (query: string) => Promise<RecipeImageSearchResult[]>;
};
