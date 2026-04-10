

# Replace AI Images with Static Library + Move Anthropic Key to Edge Function

## Summary
Three changes combined:
1. **Remove OpenAI entirely** — replace with curated illustration library stored in Supabase
2. **Move Anthropic API key to a secure backend secret** — proxy calls through an edge function instead of exposing the key client-side
3. **Remove the "each edition costs" line** from the config screen

## Architecture

```text
Client                          Edge Function                    Anthropic
  |                                  |                              |
  |-- POST /generate-news ---------> |                              |
  |   (city, date)                   |-- POST /v1/messages -------> |
  |                                  |   (uses ANTHROPIC_API_KEY)   |
  |   <-- news JSON ----------------|  <-- response ----------------|
  |
  |-- Query illustrations table ---> Supabase DB
  |   (match tags to news keywords)
```

## Database Changes

**1. Create `illustrations` table:**
- `id` uuid PK
- `type` text ('coloring' | 'cartoon')  
- `filename` text
- `storage_path` text
- `tags` text[]
- `caption` text (nullable, for cartoons)
- `last_used` timestamptz (nullable)
- `created_at` timestamptz

RLS: public read, authenticated write (or open write for now since no auth).

**2. Create `illustrations` storage bucket** (public).

**3. Seed 15 coloring page + 7 cartoon placeholder records** with SVG placeholders uploaded to storage.

## Edge Function: `generate-news`

- Accepts `{ city, childName }` in POST body
- Reads `ANTHROPIC_API_KEY` from secrets (Deno.env)
- Calls Anthropic API (same prompt, minus `coloring_prompt` and `cartoon_prompt`)
- Returns the news JSON to the client

## Secret to Add

- `ANTHROPIC_API_KEY` — user will be prompted to enter their Anthropic key as a secure secret

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/types.ts` | Remove `anthropicApiKey`, `openaiApiKey` from `TinyTimesConfig`. Remove `coloringImageUrl`, `cartoonImageUrl`. Add `coloringImage`, `cartoonImage` (with url, tags, caption). Remove `generating-images` step. |
| `src/components/ConfigScreen.tsx` | Remove both API key fields. Remove cost line. Update validation (just childName + city). |
| `src/pages/Index.tsx` | Update config validation (no API keys). |
| `src/lib/api.ts` | Remove `generateImage()` entirely. Replace `fetchNewsAndWeather` to call edge function instead of Anthropic directly. Remove image prompt fields from Claude prompt. Add illustration selection logic. |
| `src/components/Newspaper.tsx` | Update coloring/cartoon rendering to use library URLs. Remove `generating-images` step label. |
| `src/lib/sampleData.ts` | Update to match new types. |
| `src/App.tsx` | Add `/library` route. |

## New Files

| File | Purpose |
|------|---------|
| `supabase/functions/generate-news/index.ts` | Edge function proxying Anthropic calls with server-side key |
| `src/lib/illustrations.ts` | Selection algorithm: extract keywords from news, query illustrations table, score by tag match + recency, update `last_used` |
| `src/pages/Library.tsx` | Library management page with Coloring/Cartoon tabs, grid view, upload, tag editing, delete |
| `src/components/IllustrationUploader.tsx` | Drag-and-drop upload to Supabase storage + metadata insert |
| `src/components/TagEditor.tsx` | Inline tag add/remove component |

## Illustration Selection Algorithm

1. Extract keywords from news headlines + bodies (lowercase, split, filter common words)
2. Query `illustrations` where `type = 'coloring'` (or `'cartoon'`)
3. Score: +2 per tag match, -3 if used in last 2 days, -1 if used in last 7 days
4. Highest score wins; tie-break by oldest `last_used`
5. Fallback: oldest/null `last_used` (round-robin)
6. Update `last_used = now()` on selected row

## Seed Data

15 coloring pages (simple SVG placeholders): sun, tree, cat, dog, fish, bird, flower, house, boat, rocket, bear, butterfly, rainbow, star, ocean wave — each with matching tags.

7 cartoons with captions:
- "Decaf? In THIS economy?"
- "This is my warrior pose. I'm a warrior bear."
- "I told you we should have asked for directions."
- etc.

## Order of Operations

1. Add `ANTHROPIC_API_KEY` secret (prompt user)
2. Create DB migration (illustrations table)
3. Create storage bucket
4. Create edge function `generate-news`
5. Seed placeholder illustrations
6. Update types, API logic, config screen, newspaper component
7. Build library management page + upload/tag components
8. Add route

