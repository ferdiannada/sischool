# Database Migration Consolidation

## Consolidation Date: February 6, 2026

## Overview
This migration folder contains a **consolidated baseline** that replaces 93 individual migration files.

## What Was Done
- Archived 93 original migration files to `migrations_archive/`
- Created single baseline from current production schema using `supabase db dump`
- The baseline contains all:
  - Tables with proper structure
  - RLS policies
  - Functions and RPCs
  - Triggers
  - Indexes

## Migration Count
| Before | After |
|--------|-------|
| 93 files | 1 file |

## Files
- `20260206000000_consolidated_baseline.sql` - Complete schema baseline

## For Fresh Deployments
1. Use the consolidated baseline for new Supabase projects
2. Run `supabase db push` or apply via SQL editor

## For Existing Deployments
- **No action needed** - The database already has all these changes applied
- This consolidation is for cleaner codebase organization

## Archive Location
Original migration files are preserved in:
```
supabase/migrations_archive/
```

## Future Migrations
- All new migrations should be added after this baseline
- Name format: `YYYYMMDDHHMMSS_description.sql`
- Test thoroughly before committing to avoid "fix chains"
