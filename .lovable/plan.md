

## Plan: Pre-generate daily edition, simplify to static front page

### Summary

Stop generating per-visitor. Instead, generate the newspaper once daily at 1am PT via a scheduled edge function, store the result in a `daily_editions` table, and have the front page simply load today's edition. The greeting becomes inline-editable ("Good Morning, Neighbor!" by default). Nav simplifies to Print + Settings.

### Database

**New table: `daily_editions`**
- `id` (uuid, PK)
- `edition_date` (date, unique) — the date this edition is for
- `data` (jsonb) — the full `NewspaperData` payload (weather, stories, events, coloring image URL, etc.)
- `created_at` (timestamptz, default now())
- RLS: public SELECT (everyone reads today's edition), no public INSERT/UPDATE/DELETE

### Edge Function: `generate-daily-edition`

A new edge function that:
1. Fetches events from the outersunset.today API (hardcoded URL)
2. Calls the existing `generate-news` function logic (inline, not via HTTP) for city="San Francisco"
3. Selects a coloring illustration (same logic as current `selectIllustration`, but done server-side — query the `illustrations` table via Supabase client)
4. Upserts the result into `daily_editions` for today's date
5. Uses `childName: "Neighbor"` as the default

### Scheduled Cron Job

Set up `pg_cron` + `pg_net` to call `generate-daily-edition` at 1am PT (9:00 UTC) daily.

### Frontend Changes

**`Index.tsx`** — becomes a simple loader:
- On mount, fetch today's edition from `daily_editions` where `edition_date = today`
- If found, render the `Newspaper` component with that data
- If not found, show a friendly "Today's edition is being prepared" message
- No more `ConfigScreen` on first visit; settings accessed via gear icon

**`Newspaper.tsx`** — simplify:
- Remove Generate button, loading states, step indicators
- Remove Library button
- Keep Print and Settings buttons only
- The greeting ("Good Morning, Neighbor!") becomes an inline-editable text field — click to type a name, stored in localStorage, defaults to "Neighbor"
- Data comes from props (pre-loaded from DB), no more client-side generation

**`ConfigScreen.tsx`** — keep as-is but accessed only from Settings gear icon. The `childName` field here can sync with the inline greeting name via localStorage.

**Remove/simplify:**
- `src/lib/api.ts` — remove `generateNewspaper` and `fetchNewsAndWeather` (generation moves server-side). Keep `getWeatherEmoji`/`getWeatherPrompt` helpers.
- `src/pages/Library.tsx` — remove from routes (managed in backend only)
- Remove Library route from `App.tsx`

### File Changes

| File | Action |
|------|--------|
| `supabase/migrations/` | New migration: create `daily_editions` table with RLS |
| `supabase/functions/generate-daily-edition/index.ts` | New edge function combining news gen + events + illustration selection |
| `src/pages/Index.tsx` | Rewrite: fetch today's edition from DB, render Newspaper |
| `src/components/Newspaper.tsx` | Simplify: remove generate/library, add inline-editable greeting |
| `src/lib/api.ts` | Strip to helpers only; remove generation logic |
| `src/App.tsx` | Remove `/library` route |
| `src/pages/Library.tsx` | Delete |
| Cron job | Insert via SQL (pg_cron schedule) |

