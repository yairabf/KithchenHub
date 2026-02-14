export interface Category {
  id: string;
  localId?: string; // Optional to handle both mock and potentially other sources
  name: string;
  itemCount: number;
  image: string;
  backgroundColor: string;
}

export interface CategoriesGridProps {
  categories: Category[];
  onCategoryPress: (categoryName: string) => void;
}
