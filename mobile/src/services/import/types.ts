export interface IngredientInputDto {
    name: string;
    quantity?: number;
    unit?: string;
}

export interface InstructionInputDto {
    step: number;
    instruction: string;
}

export interface ImportRecipeDto {
    id: string; // The local ID
    title: string;
    prepTime?: number;
    ingredients: IngredientInputDto[];
    instructions: InstructionInputDto[];
    imageUrl?: string;
}

export interface ShoppingItemInputDto {
    masterItemId?: string;
    name: string;
    quantity?: number;
    unit?: string;
    category?: string;
    isChecked?: boolean;
}

export interface ImportShoppingListDto {
    id: string; // The local ID
    name: string;
    color?: string;
    items: ShoppingItemInputDto[];
}

export interface ImportRequestDto {
    recipes?: ImportRecipeDto[];
    shoppingLists?: ImportShoppingListDto[];
}

export interface ImportResponseDto {
    created: number;
    skipped: number;
    mappings: Record<string, string>;
}
