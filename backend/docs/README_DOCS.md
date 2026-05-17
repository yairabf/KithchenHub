# Backend Documentation Index

**Last Updated**: 2026-05-16
**Status**: ⚠️ Under cleanup. Core sync docs are preserved. The current endpoint inventory has been rechecked against controller decorators, but detailed request/response coverage is still partial.

---

## 📚 Core Documentation

### 🏠 Main Documentation
- **[Backend README](../README.md)** - Main backend documentation with API overview, setup instructions, and architecture
- **[Backend Endpoint Inventory](../../docs/api/backend-endpoints.md)** - Source-backed current endpoint inventory generated from controller decorators

### 🔄 API Sync & Conflict Resolution
- **[API Sync & Conflict Strategy](./api-sync-and-conflict-strategy.md)** ⭐ **SOURCE OF TRUTH**
  - Complete specification of `POST /api/v1/auth/sync` endpoint
  - Timestamp semantics and soft-delete behavior
  - Idempotency and conflict resolution
  - Mobile client integration details
  - **Use this for**: Technical implementation, API contract, edge cases

- **[Sync API Quick Reference](./SYNC_API_QUICK_REFERENCE.md)** 🚀
  - One-page quick reference card
  - Standard terminology and data structures
  - Common issues and solutions
  - **Use this for**: Quick lookups, terminology validation, onboarding

### 📐 API Versioning & Deprecation
- **[API Versioning Guidelines](./api-versioning-guidelines.md)**
  - What constitutes a breaking change
  - Version numbering rules
  - Process for introducing new versions
  - Payload version vs. API version

- **[API Deprecation Policy](./api-deprecation-policy.md)**
  - Deprecation workflow and timelines
  - Communication protocols
  - Sunset procedures
  - Migration support

---

## 🔍 Quality Assurance Documentation

### ✅ Consistency Audit (2026-01-28)
- **[Consistency Pass Summary](./CONSISTENCY_PASS_SUMMARY.md)** 📊
  - Executive summary of consistency audit results
  - All checks passing with zero outstanding issues
  - **Use this for**: Stakeholder review, quality assurance

- **[Consistency Checklist](./CONSISTENCY_CHECKLIST.md)** 📋
  - Detailed audit trail of all consistency checks
  - Analysis methodology and search patterns
  - Before/after comparisons for fixes
  - **Use this for**: Audit compliance, detailed analysis

- **[Consistency Pass Changelog](./CONSISTENCY_PASS_CHANGELOG.md)** 📝
  - Complete changelog of all modifications
  - Issue tracking and resolution
  - Impact assessment
  - **Use this for**: Version control, change tracking

- **[Review Hooks Added](./REVIEW_HOOKS_ADDED.md)** 🔍
  - Complete guide to code verification references
  - Before/after metrics for review time
  - Step-by-step verification workflow
  - **Use this for**: PR reviews, documentation maintenance

---

## 🎯 Documentation by Use Case

### For New Developers
**Recommended reading order**:
1. Start: [Backend README](../README.md) - Get the big picture
2. Then: [Sync API Quick Reference](./SYNC_API_QUICK_REFERENCE.md) - Learn sync API terminology
3. Deep dive: [API Sync & Conflict Strategy](./api-sync-and-conflict-strategy.md) - Understand full behavior

### For Mobile Developers
**Recommended reading order**:
1. Start: [Sync API Quick Reference](./SYNC_API_QUICK_REFERENCE.md) - Understand API contract
2. Then: [API Sync & Conflict Strategy](./api-sync-and-conflict-strategy.md) - Full sync behavior
3. Reference: [Backend Endpoint Inventory](../../docs/api/backend-endpoints.md) - Current source-backed endpoint list

### For API Design Changes
**Recommended reading order**:
1. Start: [API Versioning Guidelines](./api-versioning-guidelines.md) - Understand versioning rules
2. Then: [API Deprecation Policy](./api-deprecation-policy.md) - Plan deprecation timeline
3. Update: [API Sync & Conflict Strategy](./api-sync-and-conflict-strategy.md) - Update source of truth

### For QA/Testing
**Recommended reading order**:
1. Start: [Sync API Quick Reference](./SYNC_API_QUICK_REFERENCE.md) - Standard behavior
2. Then: [API Sync & Conflict Strategy](./api-sync-and-conflict-strategy.md) - Edge cases (Lines 230-245)
3. Reference: [Consistency Checklist](./CONSISTENCY_CHECKLIST.md) - Invariants to test

### For Product/Design
**Recommended reading order**:
1. Start: [Consistency Pass Summary](./CONSISTENCY_PASS_SUMMARY.md) - High-level overview
2. Then: [Backend README](../README.md) - Feature capabilities
3. Reference: [API Sync & Conflict Strategy](./api-sync-and-conflict-strategy.md) - "Not Implemented" features

---

## 🔑 Key Concepts Cross-Reference

### Endpoint Naming
- **Standard**: `POST /api/v1/auth/sync`
- **Documents**: All docs use consistent full path
- **See**: [Consistency Checklist](./CONSISTENCY_CHECKLIST.md) § "Endpoint Naming"

### Standard Terminology
- **Terms**: `operationId`, `requestId`, `payloadVersion`, `succeeded[]`, `conflicts[]`
- **Definition**: [Sync API Quick Reference](./SYNC_API_QUICK_REFERENCE.md) § "Request Structure"
- **Usage**: [API Sync & Conflict Strategy](./api-sync-and-conflict-strategy.md) § "Request DTOs"
- **Validation**: [Consistency Checklist](./CONSISTENCY_CHECKLIST.md) § "Terminology"

### Timestamp Semantics
- **Rule**: Server ignores client timestamps, Prisma auto-bumps `updatedAt`
- **Detailed**: [API Sync & Conflict Strategy](./api-sync-and-conflict-strategy.md) § "Timestamp Semantics" (Lines 192-238)
- **Quick**: [Sync API Quick Reference](./SYNC_API_QUICK_REFERENCE.md) § "Timestamp Semantics"
- **Validation**: [Consistency Checklist](./CONSISTENCY_CHECKLIST.md) § "Timestamp Semantics"

### Soft-Delete Semantics
- **Rule**: Sync does NOT resurrect soft-deleted entities
- **Detailed**: [API Sync & Conflict Strategy](./api-sync-and-conflict-strategy.md) § "Re-Upsert After Soft-Delete" (Lines 230-245)
- **Quick**: [Sync API Quick Reference](./SYNC_API_QUICK_REFERENCE.md) § "Soft-Delete Semantics"
- **Validation**: [Consistency Checklist](./CONSISTENCY_CHECKLIST.md) § "Soft Delete Semantics"

### Idempotency
- **Key**: `operationId` (UUID v4) per entity
- **Detailed**: [API Sync & Conflict Strategy](./api-sync-and-conflict-strategy.md) § "Idempotency Behavior" (Lines 279-299)
- **Quick**: [Sync API Quick Reference](./SYNC_API_QUICK_REFERENCE.md) § "Idempotency"

### Implementation Status
- **Not Implemented**:
  - Server-side timestamp-aware conflict checks
  - Payload version branching
  - Resurrection semantics for soft-deleted entities
  - Server-side LWW gate
- **See**: [API Sync & Conflict Strategy](./api-sync-and-conflict-strategy.md) § "Planned/Design (Not Implemented Yet)" (Lines 67-82)
- **Also**: Line 445 - "Future work (Not Implemented)"

---

## 📊 Documentation Metrics

### Coverage
- ✅ **API Endpoints**: current endpoint inventory lives in `../../docs/api/backend-endpoints.md` and was rechecked against controller decorators on 2026-05-16.
- ✅ **Sync Edge Cases**: preserved in `api-sync-and-conflict-strategy.md` and `SYNC_API_QUICK_REFERENCE.md`.
- ⚠️ **Terminology**: sync terminology is documented; broader backend/API terminology should be rechecked as docs are consolidated.
- ⚠️ **Implementation Status**: sync implementation status is labeled; subscription/provider and recipe-image endpoints need dedicated docs if they become public contracts.

### Quality
- ⚠️ **Consistency**: previous 2026-01-28 consistency pass is historical; use the 2026-05-16 endpoint inventory for current route coverage. Swagger setup remains disabled in `src/main.ts`.
- ⚠️ **Completeness**: core endpoints are inventoried, but detailed API reference coverage is not yet complete.
- ✅ **Clarity**: sync docs clearly separate current behavior from planned/not-implemented behavior.

### Maintenance
- ✅ **Last Audit**: 2026-01-28
- ✅ **Next Review**: When implementing "Not Implemented" features
- ✅ **Version Control**: All changes tracked in changelog

---

## 🔄 Document Relationships

```
Backend README (Main Entry Point)
    ├── API Sync & Conflict Strategy (Source of Truth)
    │   ├── Sync API Quick Reference (Quick Lookup)
    │   └── Consistency Checklist (Validation)
    ├── API Versioning Guidelines
    │   └── API Deprecation Policy
    └── Consistency Pass Docs
        ├── Consistency Pass Summary (Executive Summary)
        ├── Consistency Checklist (Audit Trail)
        └── Consistency Pass Changelog (Change Log)
```

---

## 🆘 Common Questions

### Q: Which document is the source of truth for sync API?
**A**: [API Sync & Conflict Strategy](./api-sync-and-conflict-strategy.md) - It's explicitly labeled as the source of truth in the first paragraph.

### Q: Where can I find a quick reference for sync API?
**A**: [Sync API Quick Reference](./SYNC_API_QUICK_REFERENCE.md) - One-page card with all terminology and examples.

### Q: How do I know if a feature is implemented?
**A**: Check [API Sync & Conflict Strategy](./api-sync-and-conflict-strategy.md) § "Planned/Design (Not Implemented Yet)" (Lines 67-82) for unimplemented features.

### Q: What happens if I sync a soft-deleted entity?
**A**: See [API Sync & Conflict Strategy](./api-sync-and-conflict-strategy.md) § "Re-Upsert After Soft-Delete (Edge Case)" (Lines 230-245) - Entity gets updated but stays deleted.

### Q: How do I introduce a breaking change?
**A**: Follow process in [API Versioning Guidelines](./api-versioning-guidelines.md) § "Process for Introducing Breaking Changes".

### Q: What's the difference between API version and payload version?
**A**: See [API Versioning Guidelines](./api-versioning-guidelines.md) § "Payload Version vs API Version" - They're orthogonal concepts.

---

## 📞 Feedback & Updates

### Reporting Issues
- Found inconsistency? → Check [Consistency Checklist](./CONSISTENCY_CHECKLIST.md) first
- Missing documentation? → Raise issue with project management
- Outdated information? → Submit PR with updates

### Contributing
When updating documentation:
1. Update source of truth first: [API Sync & Conflict Strategy](./api-sync-and-conflict-strategy.md)
2. Update related docs: [Sync API Quick Reference](./SYNC_API_QUICK_REFERENCE.md), [Backend README](../README.md)
3. Run consistency check (see [Consistency Checklist](./CONSISTENCY_CHECKLIST.md))
4. Update this index if adding new documents

---

## 🎉 Recent Updates

### 2026-01-28: Consistency Pass + Review Hooks ✅
- ✅ Added explicit "Not Implemented" labels
- ✅ Added "Re-Upsert After Soft-Delete" edge case documentation
- ✅ Created Quick Reference Card
- ✅ Created comprehensive consistency audit docs
- ✅ **Added "Code Reference" section with exact file paths and line numbers**
- ✅ **Added "Code Verification" section to worked example**
- ✅ **Added comprehensive review hooks guide**
- ✅ Zero outstanding consistency issues

---

**Document Version**: 1.0
**Maintained By**: Backend Team
**Next Review**: When implementing planned features or quarterly
