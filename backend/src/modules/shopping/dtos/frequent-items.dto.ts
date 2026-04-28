export class FrequentShoppingItemDto {
  id: string;
  name: string;
  category?: string;
  image?: string;
  sourceType: 'catalog' | 'custom';
}

export class FrequentShoppingItemsResponseDto {
  items: FrequentShoppingItemDto[];
}
