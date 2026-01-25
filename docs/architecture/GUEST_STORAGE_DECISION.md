# Guest Storage Backend Decision (AsyncStorage v1)

**Decision Date**: 2026-01-25  
**Status**: Active  
**Version**: v1

## Decision

**AsyncStorage is the chosen backend for Guest Mode v1.**

### Rationale

- **Fast Implementation**: AsyncStorage is built into React Native, requires no additional dependencies
- **Simple JSON Persistence**: Aligns with current guest-only data flows using JSON serialization
- **Sufficient for Limited Scope**: Guest data is limited to shopping lists, recipes, chores, and items
- **Avoids Premature Complexity**: No need for database setup, migrations, or complex query logic at this stage
- **Easy to Reason About**: Simple key-value storage with straightforward read/write operations

## Operational Limits

AsyncStorage is acceptable **only while the following constraints hold**:

### 1. Performance Limits

- **Read/Write Pattern**: Full collection read → modify → full collection write
  - Every update requires loading the entire collection into memory
  - No partial updates - updating one item requires rewriting the entire collection
- **Scalability**: Linear degradation with payload size
  - Performance degrades proportionally as data grows
  - Large arrays require full read → modify → write cycles
- **No Indexing**: All filtering/searching done in-memory after full read
  - Must load entire collection to find a single item
  - No storage-level optimization for queries

### 2. Atomicity Limits

- **No Transactions**: Multiple related writes cannot be atomic
  - Cannot guarantee consistency across multiple entity types
  - If one write succeeds and another fails, data may be inconsistent
- **Race Conditions**: Concurrent writes can overwrite each other
  - Last write wins - no conflict detection
  - Application must implement single-writer pattern to prevent data loss
- **Partial Writes**: If app crashes mid-write, data may be corrupted
  - No rollback mechanism
  - No write-ahead logging or transaction recovery

### 3. Query Limitations

- **No SQL Queries**: Cannot filter, sort, or join at storage level
  - All querying must be done in-memory after loading full collection
  - Cannot leverage database indexes for performance
- **No Indexing**: No performance optimization for large datasets
  - Every query requires full collection scan
  - No way to optimize for common access patterns
- **Full Collection Load**: Must load entire collection to find one item
  - Memory usage scales with total data size
  - Cannot paginate or lazy-load data

### 4. Concurrency Limits

- **Single Writer Pattern Required**: Must implement application-level locking
  - No built-in concurrency control
  - Application must coordinate writes to prevent conflicts
- **No Optimistic Locking**: No built-in conflict detection
  - Cannot detect when data has changed between read and write
  - Must implement version checking manually if needed
- **Write Conflicts**: Last write wins (no merge semantics)
  - Concurrent modifications will result in lost updates
  - No automatic conflict resolution

## Migration Triggers

Migration to SQLite / WatermelonDB should be initiated when **any** of the following become true:

### Trigger 1: Data Size

- **Threshold**: Guest data regularly exceeds **~1,000 total entities** across all types (recipes, shopping lists, items, chores)
- **OR**: Any single persisted payload exceeds **~1–2 MB**
- **Measurement**: Add logging/metrics to track entity counts and payload sizes in `guestStorage` methods

### Trigger 2: Performance

- **Threshold**: Read or write operations exceed **~100–200ms** on mid-range devices
- **OR**: UI stutters during AsyncStorage operations (user-visible lag)
- **Measurement**: Add performance monitoring to `guestStorage` methods to track operation durations

### Trigger 3: Feature Requirements

- Need partial updates (update one item without rewriting full collection)
- Need local indexing or complex queries (filtering, sorting, searching)
- Guest mode begins to require offline sync or conflict resolution logic
- Need transaction support for multi-entity operations (atomic updates across entity types)

### Trigger 4: Reliability Issues

- Evidence of lost updates due to overlapping writes
- Increased reports of guest data being overwritten or disappearing
- Data corruption incidents (malformed JSON, partial writes)

## Migration Plan Outline

When a trigger is hit, follow these high-level steps:

### Migration Steps

1. **Read existing AsyncStorage data**
   - Use existing `guestStorage` methods to read all entity types
   - Validate data integrity before migration

2. **Transform data**
   - Convert to DB-ready entity format
   - May need schema migration if entity structure has changed
   - Preserve all metadata (timestamps, localIds, etc.)

3. **Initialize database**
   - Set up SQLite/WatermelonDB schema
   - Create tables/collections for all entity types
   - Set up indexes for common query patterns

4. **Write data to database**
   - Bulk insert with transaction
   - Ensure atomic migration (all or nothing)
   - Verify data integrity after migration

5. **Mark migration complete**
   - Store version flag in AsyncStorage or DB
   - Use flag to prevent re-migration on subsequent app launches

6. **Update service layer**
   - Switch from `guestStorage` to DB-backed storage
   - Update `LocalRecipeService`, `LocalShoppingService`, etc.
   - Maintain same API surface to minimize changes

7. **Stop writing to AsyncStorage**
   - Remove AsyncStorage writes from all services
   - Keep read capability temporarily for rollback

8. **Cleanup (optional)**
   - Remove old AsyncStorage keys after verification period
   - Only after confirming migration is stable and successful

### Rollback Strategy

- **If migration fails**: Do NOT mark as completed
  - Continue using AsyncStorage until migration succeeds
  - Keep AsyncStorage data intact for rollback
  - Log errors for debugging

- **If migration succeeds but issues arise**:
  - Keep AsyncStorage data for a grace period (e.g., 30 days)
  - Provide manual rollback mechanism if needed
  - Monitor for data inconsistencies

### Database Options

When migration is triggered, consider:

- **SQLite**: Direct SQL queries, transactions, indexing
  - Full control over schema and queries
  - Requires SQL knowledge
  - Good for complex queries and relationships

- **WatermelonDB**: React Native optimized, built-in sync capabilities, observable queries
  - Built for React Native with performance optimizations
  - Observable queries for reactive UI updates
  - Built-in sync capabilities if guest mode later needs sync
  - More opinionated but easier to use

## Related Documentation

- [Data Modes Architecture Specification](./DATA_MODES_SPEC.md) - Overall data mode architecture
- [`mobile/src/common/utils/guestStorage.ts`](../../mobile/src/common/utils/guestStorage.ts) - Current implementation

## Success Criteria

- ✅ Decision to use AsyncStorage is explicitly documented
- ✅ Operational limits are clearly stated and measurable
- ✅ Migration triggers are unambiguous and measurable
- ✅ High-level migration plan exists to guide future work
