## cacheStorage module

The `cacheStorage` module implements **versioned cache array storage** for signed-in users.
It provides safe, versioned storage for cached entity arrays with migration support and corruption handling.

### Responsibilities

- Store cached entity arrays in AsyncStorage under signed-in cache keys (`@kitchen_hub_cache_*`)
- Provide versioned wrapper format: `{ version: number, entities: T[] }`
- Handle legacy format migration (arrays without version wrapper)
- Detect and handle corruption gracefully
- Support future version detection (preserve data without migration)
- Write-back normalization for migrated data

### Key Files

- `cacheStorage.ts` – Main cache read/write functions with migration logic
- `cacheStorage.types.ts` – Type definitions (`VersionedCacheArray`, `CacheReadStatus`, format detection types)
- `cacheStorage.constants.ts` – Version constants and helper functions
- `cacheMetadata.ts` – Cache metadata storage with versioning support

### Schema Versioning

- **Storage schema versions**:
  - Cache entity arrays are stored as `{ version: number, entities: T[] }` wrapper
  - Constants:
    - `CURRENT_CACHE_ENTITY_STORAGE_VERSION` (global, currently `1`)
    - `CURRENT_CACHE_ENTITY_STORAGE_VERSION_BY_TYPE` (optional per-entity overrides)
    - `CURRENT_CACHE_METADATA_STORAGE_VERSION` (currently `1`)
  - Legacy arrays without `version` wrapper are treated as version `1` and migrated on read
  - Cache metadata includes optional `version?: number` field

- **Migration behavior**:
  - Migrations happen at read-time (`readCacheArray()`, `getCacheMetadata()`)
  - Migrations are **pure transforms** (no storage I/O inside)
  - Migrations are **idempotent** (safe if re-run)
  - Migrations are **sequential** (applied from `fromVersion` to `toVersion`)
  - Normalized data is written back only when migration occurred and blob differs

- **Future version handling**:
  - Cache arrays with `version > CURRENT` are **never migrated**
  - Future versions are **never written back** or cleared
  - Entities are returned if parseable (avoids cache miss loops)
  - Status is set to `'future_version'` for repository handling

- **Corruption handling**:
  - Distinguishes: legacy, current wrapper, future wrapper, corrupt JSON, wrong type
  - Corrupt data is **never written back** or cleared
  - Returns safe fallbacks (empty array for entities, null for metadata)
  - Status is set to `'corrupt'` for repository handling

### Cache Read Status

The `readCacheArray()` function returns a `CacheReadResult<T>` with a `status` field:

- `'ok'` – Data is current version, no migration needed
- `'migrated'` – Legacy data was migrated to current version
- `'future_version'` – Data has future version (preserved, not migrated)
- `'corrupt'` – Data is corrupted (safe fallback returned)

### Repository Integration

Cache-aware repositories handle status appropriately:
- `'ok'` and `'migrated'`: Return data normally
- `'future_version'`: Prefer network fetch but preserve local data (don't overwrite)
- `'corrupt'`: Return empty array (triggers network fetch)

### Usage Example

```typescript
import { readCacheArray, writeCacheArray } from '../utils/cacheStorage';

// Read cache with migration support
const result = await readCacheArray<Recipe>('recipes');
if (result.status === 'future_version') {
  // Handle future version appropriately
  console.warn('Cache has future version, prefer network fetch');
}

// Write cache (always uses versioned format)
await writeCacheArray('recipes', recipes);
```

### Migration Registry

Migrations are defined in `CACHE_ENTITY_MIGRATIONS` registry:
- Maps version number to migration function
- Migrations transform data from one version to the next
- Currently only version 1 migration exists (normalizes legacy arrays)

To add a new migration:
1. Increment `CURRENT_CACHE_ENTITY_STORAGE_VERSION`
2. Add migration function to `CACHE_ENTITY_MIGRATIONS` registry
3. Ensure migration is pure, idempotent, and sequential
