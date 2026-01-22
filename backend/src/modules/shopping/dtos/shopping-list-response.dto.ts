export class ShoppingListSummaryDto {
  id: string;
  name: string;
  color?: string;
  itemCount: number;
}

export class ShoppingItemDto {
  id: string;
  catalogItemId?: string;
  name: string;
  quantity: number;
  unit?: string;
  isChecked: boolean;
  category?: string;
}

export class ShoppingListDetailDto {
  id: string;
  name: string;
  color?: string;
  items: ShoppingItemDto[];
}
