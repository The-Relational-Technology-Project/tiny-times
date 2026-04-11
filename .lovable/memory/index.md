# Project Memory

## Core
Sunset neighborhood edition, hardcoded to San Francisco / Outer Sunset.
Daily edition pre-generated at 1am PT via pg_cron → generate-daily-edition edge function.
No per-visitor generation. Frontend loads from daily_editions table.
Greeting inline-editable, defaults to "Neighbor", stored in localStorage.

## Memories
- [Daily edition architecture](mem://features/daily-edition) — Pre-generated editions, pg_cron schedule, generate-daily-edition edge function
