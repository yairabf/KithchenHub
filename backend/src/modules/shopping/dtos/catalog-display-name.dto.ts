/**
 * DTO for batch catalog display name resolution.
 * Used by GET /groceries/names to return localized names for catalog IDs.
 */
export class CatalogDisplayNameDto {
  id: string;
  name: string;
}
