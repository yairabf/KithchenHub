export interface Category {
  id: string;
  name: string;
  itemCount: number;
  image: string;
  backgroundColor: string;
}

export interface CategoriesGridProps {
  categories: Category[];
  onCategoryPress: (categoryName: string) => void;
  onSeeAllPress: () => void;
}
