

# The Tiny Times — Daily Personalized Newspaper for Toddlers

## Overview
A print-first web app that generates a daily personalized newspaper for toddlers (ages 2-5). Parents configure it once, then click "Generate" each morning to produce a beautiful, single-page printable newspaper with real news, local events, weather, a coloring page, a cartoon, and activities.

## Screens

### 1. Configuration Screen (one-time setup)
- Friendly onboarding form collecting: child's name, city, neighborhood, events API URL (with defaults), Anthropic API key, OpenAI API key
- Stored in localStorage
- Warm, inviting design that matches the newspaper aesthetic
- "Start Reading" button → navigates to newspaper view

### 2. Newspaper View (main screen)
A print-optimized, single-page (8.5×11") newspaper layout with these content blocks:

- **Masthead**: "The Tiny Times" in Fredoka One, date, personalized greeting — warm red with gold accents
- **Weather strip**: Emoji, temperature, playful prompt — thin horizontal bar
- **Three news stories** in a columnar layout: Local / National / World, each with category label, headline, 2-sentence body, conversation question, source — accent colors (orange, green, blue)
- **Coloring page panel**: AI-generated black-and-white line drawing (PNG)
- **Local events panel**: "[Neighborhood] Today" with 3-5 events (time, name, location)
- **Fun fact**: Single delightful sentence
- **Activity suggestion**: Weather/news-tied activity
- **Daily cartoon**: Full-width line-art panel with witty caption in italic serif
- **Footer**: Attribution with CC BY 4.0 credit

UI controls (hidden in print):
- **Generate button** with loading states ("Gathering today's news…", "Drawing your coloring page…")
- **Print button** — one-click, clean output
- **Settings gear** — to edit config

### 3. Print Output
- `@media print` CSS hides all UI controls
- Optimized for US Letter (8.5×11") portrait
- Tight spacing, graceful truncation if content overflows
- No browser chrome

## Typography & Design
- **Masthead/Headlines**: Fredoka One (Google Fonts) — bold, rounded, playful
- **Body**: Nunito (Google Fonts) — clean, readable at small sizes
- **Cartoon caption**: Playfair Display Italic — classic New Yorker feel
- **Colors**: Warm red masthead, golden yellow accents, soft orange/green/blue story blocks, white backgrounds
- **Feel**: Warm, handmade, fridge-worthy — Highlights magazine meets neighborhood newsletter

## Data Flow (on "Generate" click)
1. Fetch community events from neighborhood API (fast, no auth)
2. Fetch news + weather + image prompts from Anthropic Claude API (with web search tool)
3. In parallel after step 2: Generate coloring page + cartoon via OpenAI Images API
4. Render everything into the newspaper layout

## Error Handling
- Friendly fallbacks for each section if API calls fail (e.g., "Today's coloring page is taking a nap!")
- Layout never breaks — graceful degradation
- Sample/mock data shown before first generation

## Technical Notes
- API keys stored in localStorage (Anthropic + OpenAI called directly from client since these are user-provided keys)
- API calls made from the browser using the user's own keys
- Sample data pre-populated for initial design preview
- Cost estimate shown subtly (~$0.05-0.15 per generation)

