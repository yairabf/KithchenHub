/**
 * Catalog Types
 * 
 * Shared type definitions for catalog-related DTOs and data structures.
 * Used across services, repositories, and components.
 */

/**
 * DTO type for API response from `/groceries/search` endpoint.
 * 
 * This type represents the structure of grocery items returned by the backend API.
 * The endpoint is public (no authentication required) and supports query parameter `q`
 * for filtering (though empty query returns all items).
 * 
 * @example
 * ```typescript
 * const response: GrocerySearchItemDto[] = await api.get('/groceries/search?q=');
 * const mapped = response.map(item => ({
 *   id: item.id,
 *   name: item.name,
 *   // ... map to GroceryItem format
 * }));
 * ```
 */
export interface GrocerySearchItemDto {
  id: string;
  name: string;
  category: string;
  imageUrl?: string | null;
  defaultQuantity?: number | null;
}
