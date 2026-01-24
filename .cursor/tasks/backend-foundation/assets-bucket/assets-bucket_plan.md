# Assets Bucket

**Epic:** Backend Foundation
**Created:** 2026-01-23
**Status:** Planning

## Overview
- Set up a Supabase Storage bucket named `public-assets` with public read access.
- Upload the avatar placeholder sourced from `mobile/assets/icon.png`.
- Create the required folder structure for grocery icons.

## Architecture
- Storage provider: Supabase Storage
- Bucket: `public-assets` (public)
- Folder structure:
  - `/grocery-icons/` (folder placeholder only)
  - `/defaults/avatar-placeholder.png` (actual file)

## Implementation Steps
1. Create a public Supabase Storage bucket `public-assets` with `public: true` and image MIME restrictions.
2. Upload the placeholder asset by copying `mobile/assets/icon.png` to `defaults/avatar-placeholder.png`.
3. Create the `grocery-icons/` folder path (upload a `.keep` file if needed).
4. Validate public URLs for the uploaded assets.

## Testing Strategy
- Manual: Access the public URLs in a browser (no auth) to confirm 200 OK and correct image render.

## Success Criteria
- `public-assets` bucket exists and is public.
- Public read access works for uploaded assets.
- Folder structure present with `/grocery-icons/` and `/defaults/avatar-placeholder.png`.
- Public URLs validate in browser.
