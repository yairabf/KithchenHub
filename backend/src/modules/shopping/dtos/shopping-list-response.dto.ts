export class ShoppingListSummaryDto {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  isMain: boolean;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ShoppingItemDto {
  id: string;
  catalogItemId?: string;
  name: string;
  quantity: number;
  unit?: string;
  isChecked: boolean;
  category?: string;
  image?: string;
}

export class ShoppingListDetailDto {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  items: ShoppingItemDto[];
}
