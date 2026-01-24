# 005 - Master Grocery Catalog

**Epic:** Backend Foundation
**Created:** 2026-01-23
**Status:** Planning

## Overview
- Centralize default grocery items in a database-backed catalog
- Replace in-memory grocery search with catalog queries
- Allow shopping items to reference catalog entries or use safe copies

## Architecture
- Components affected: shopping service, shopping repository, shopping DTOs
- New files to create: Prisma migration for catalog table and seed data
- Files to modify: Prisma schema, shopping service/repository/DTOs, backend README
- Dependencies required: none (Prisma schema + migration only)

## Implementation Steps
1. Add catalog table and optional FK in Prisma schema + migration
2. Seed 111 default catalog items from the mobile mock database
3. Add read-only RLS policy for catalog
4. Wire shopping item creation and grocery search to catalog
5. Add tests for catalog-backed flows

## API Changes (if applicable)
- Grocery search responses include catalog IDs and defaults
- Shopping item payloads accept optional catalog identifiers

## Testing Strategy
- Unit tests for catalog search and add-items behavior
- Manual verification of catalog-only read access

## Success Criteria
- Catalog table exists with 111 seeded items
- Users can read catalog but cannot write
- Shopping items can reference catalog or use custom names
- Grocery search uses catalog data
