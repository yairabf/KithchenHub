/**
 * Represents a grocery item from the catalog database.
 * Shared across shopping search, AllItemsModal, and any other
 * component that needs to display or select catalog items.
 */
export interface GroceryItem {
  id: string;
  name: string;
  /** URL for the item's image. May be an empty string when no image is available. */
  image: string;
  category: string;
  defaultQuantity: number;
}
