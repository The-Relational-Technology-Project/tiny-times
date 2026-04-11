---
name: Daily edition architecture
description: Pre-generated newspaper via scheduled edge function, loaded from daily_editions table
type: feature
---
- `daily_editions` table stores one row per day with full NewspaperData as JSONB
- `generate-daily-edition` edge function runs at 1am PT (9:00 UTC) via pg_cron
- Function fetches events from outersunset.today API, news from Lovable AI Gateway (gemini-2.5-flash), and selects a coloring illustration
- Frontend (Index.tsx) loads today's edition from daily_editions on mount
- No client-side generation; Newspaper component receives data as props
- Greeting is inline-editable, stored in localStorage under "tiny-times-name"
- Nav: Print + Settings only (no Generate, no Library)
