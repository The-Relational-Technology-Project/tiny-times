

## Plan: RSS feeds + Lovable AI for real news

### Summary
Replace the Anthropic Claude call with a two-step pipeline: (1) fetch real headlines from public RSS feeds, (2) pass them to Lovable AI (Gemini) for kid-friendly selection and rewriting. This eliminates hallucinated stories, removes the Anthropic API dependency, and costs nothing extra.

### How it works

```text
RSS Feeds (free, real headlines)
  → Parse XML, extract titles + links + descriptions
  → Feed into Lovable AI (gemini-3-flash-preview)
  → AI selects 1 upbeat story per category, rewrites for toddlers
  → Returns structured JSON (same shape as today)
```

### RSS Sources

| Level | Feed URL | Why |
|-------|----------|-----|
| Local SF | `https://www.sfgate.com/bayarea/feed/Bay-Area-News-702.php` | Free, updated frequently, SF-focused |
| National | `https://news.google.com/rss/search?q=good+news+USA&hl=en-US` | Google News aggregation filtered for positive US stories |
| World | `https://news.google.com/rss/search?q=good+news+world&hl=en-US` | Same, global scope |

### Edge Function Changes (`generate-daily-edition/index.ts`)

1. **Remove** Anthropic API key, URL, and Claude call
2. **Add** `fetchRSSHeadlines()` — fetches all 3 RSS feeds in parallel, parses XML (simple regex or DOMParser), extracts title + link + description for the ~10 most recent items per feed
3. **Update** `fetchNews()` to:
   - Call `fetchRSSHeadlines()` first
   - Pass the real headlines into Lovable AI Gateway (`gemini-3-flash-preview`) with a prompt like: "Here are real news headlines. Pick 1 upbeat, kid-safe story from each category. Rewrite headline (max 7 words) and body (2 simple sentences) for a 3-year-old. Include the source URL. Also provide weather, funFact, and activity."
   - Parse the structured JSON response (same schema as current)
4. **Fallback**: If RSS fetch fails, let AI generate stories but mark them as "inspired by real events"

### What stays the same
- Events fetching (outersunset.today API) — unchanged
- Coloring image selection — unchanged  
- Daily editions table + cron job — unchanged
- Frontend — unchanged (same data shape)
- Weather — still AI-generated (reliable enough, verifiable)

### File Changes

| File | Change |
|------|--------|
| `supabase/functions/generate-daily-edition/index.ts` | Remove Anthropic, add RSS fetching, switch to Lovable AI Gateway |
| `.lovable/memory/features/daily-edition.md` | Update to reflect RSS + Lovable AI pipeline |

### Cost impact
- Removes Anthropic API cost entirely
- Lovable AI (Gemini flash) is included/cheap
- RSS feeds are free

