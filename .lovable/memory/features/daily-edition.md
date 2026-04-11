---
name: Daily edition architecture
description: Pre-generated newspaper via scheduled edge function, loaded from daily_editions table
type: feature
---
- `daily_editions` table stores one row per day with full NewspaperData as JSONB
- `generate-daily-edition` edge function runs at 1am PT (9:00 UTC) via pg_cron
- Function fetches RSS feeds (SFGate local, Google News national/world), events from outersunset.today API, and selects a coloring illustration
- RSS headlines are passed to Lovable AI Gateway (gemini-3-flash-preview) which selects upbeat kid-safe stories and rewrites them for toddlers
- Source URLs from original articles are preserved in the `source` field
- Frontend (Index.tsx) loads today's edition from daily_editions on mount
- No client-side generation; Newspaper component receives data as props
- Greeting is inline-editable, stored in localStorage under "tiny-times-name"
- Nav: Print + Settings only (no Generate, no Library)
