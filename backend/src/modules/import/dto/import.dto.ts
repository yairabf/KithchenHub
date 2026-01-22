import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRecipeDto } from '../../recipes/dtos/create-recipe.dto';
import { CreateListDto } from '../../shopping/dtos/create-list.dto';
import { ShoppingItemInputDto } from '../../shopping/dtos/add-items.dto';

export class ImportRecipeDto extends CreateRecipeDto {
    @IsString()
    @IsNotEmpty()
    id: string; // The local ID
}

export class ImportShoppingListDto extends CreateListDto {
    @IsString()
    @IsNotEmpty()
    id: string; // The local ID

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ShoppingItemInputDto)
    items: ShoppingItemInputDto[];
}

export class ImportRequestDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ImportRecipeDto)
    @IsOptional()
    recipes?: ImportRecipeDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ImportShoppingListDto)
    @IsOptional()
    shoppingLists?: ImportShoppingListDto[];
}

/**
 * Response DTO for import operation
 * Contains statistics and ID mappings for client to update local references
 */
export class ImportResponseDto {
    /** Number of new items created */
    created: number;

    /** Number of items skipped (already existed) */
    skipped: number;

    /** Map of original local IDs to new server-side IDs */
    mappings: Record<string, string>;
}
