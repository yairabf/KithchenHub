/**
 * Import source types for tracking data origin
 */
export enum ImportSource {
  /** Data imported to household account */
  GUEST_MODE_MIGRATION = 'GUEST_MODE_MIGRATION',
  /** Data uploaded via CSV file */
  CSV_UPLOAD = 'CSV_UPLOAD',
  /** Data integrated from external API */
  API_INTEGRATION = 'API_INTEGRATION',
}

/**
 * Import batch status values
 */
export enum ImportStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Entity types for import mapping to prevent ID collisions
 */
export enum ImportEntityType {
  RECIPE = 'RECIPE',
  SHOPPING_LIST = 'SHOPPING_LIST',
}
