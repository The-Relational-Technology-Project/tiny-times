import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.103.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const EVENTS_API_URL = 'https://nawdvulumebqbxmkedzw.supabase.co/functions/v1/get-public-events';
const CITY = 'San Francisco';
const NEIGHBORHOOD = 'Outer Sunset';

const RSS_FEEDS = {
  local: 'https://missionlocal.org/feed/',
  national: 'https://www.goodnewsnetwork.org/feed/',
  world: 'https://www.positive.news/feed/',
};

const WEATHER_EMOJIS: Record<string, string> = {
  sun: '☀️', cloud: '☁️', rain: '🌧️', snow: '❄️', fog: '🌫️', wind: '💨',
};

function getWeatherEmoji(key: string): string {
  return WEATHER_EMOJIS[key?.toLowerCase()] || '🌤️';
}

async function fetchEvents(): Promise<any[]> {
  try {
    const now = new Date();
    const ptDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const yyyy = ptDate.getFullYear();
    const mm = String(ptDate.getMonth() + 1).padStart(2, '0');
    const dd = String(ptDate.getDate()).padStart(2, '0');
    const todayStart = `${yyyy}-${mm}-${dd}T00:00:00`;
    const todayEnd = `${yyyy}-${mm}-${dd}T23:59:59`;

    const url = `${EVENTS_API_URL}?start_after=${todayStart}&start_before=${todayEnd}&limit=4`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Events API failed');

    const data = await res.json();
    return (data.events || []).slice(0, 4).map((e: any) => ({
      time: new Date(e.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' }),
      name: e.name,
      place: e.location?.name || 'TBD',
    }));
  } catch (err) {
    console.error('Failed to fetch events:', err);
    return [];
  }
}

interface RSSItem {
  title: string;
  link: string;
  description: string;
}

async function fetchRSSFeed(url: string): Promise<RSSItem[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
    const xml = await res.text();

    const items: RSSItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 10) {
      const itemXml = match[1];
      const title = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || '';
      const link = itemXml.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/)?.[1] || '';
      const description = itemXml.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/)?.[1] || '';
      if (title) {
        items.push({ title: title.trim(), link: link.trim(), description: description.replace(/<[^>]*>/g, '').trim().slice(0, 300) });
      }
    }
    return items;
  } catch (err) {
    console.error(`RSS fetch error for ${url}:`, err);
    return [];
  }
}

async function fetchRSSHeadlines(): Promise<{ local: RSSItem[]; national: RSSItem[]; world: RSSItem[] }> {
  const [local, national, world] = await Promise.all([
    fetchRSSFeed(RSS_FEEDS.local),
    fetchRSSFeed(RSS_FEEDS.national),
    fetchRSSFeed(RSS_FEEDS.world),
  ]);
  return { local, national, world };
}

function formatHeadlinesForPrompt(headlines: { local: RSSItem[]; national: RSSItem[]; world: RSSItem[] }): string {
  const format = (items: RSSItem[]) =>
    items.map((item, i) => `${i + 1}. "${item.title}" — ${item.description} (${item.link})`).join('\n');

  return `LOCAL SF NEWS:\n${format(headlines.local) || 'No headlines available'}\n\nNATIONAL US NEWS:\n${format(headlines.national) || 'No headlines available'}\n\nWORLD NEWS:\n${format(headlines.world) || 'No headlines available'}`;
}

async function fetchNews(headlines: { local: RSSItem[]; national: RSSItem[]; world: RSSItem[] }): Promise<any> {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/Los_Angeles',
  });

  const hasHeadlines = headlines.local.length > 0 || headlines.national.length > 0 || headlines.world.length > 0;
  const headlinesContext = hasHeadlines
    ? `Here are today's real news headlines. Pick 1 upbeat, positive, kid-safe story from each category. Rewrite the headline and body for a 3-year-old. Use the original article URL as the "source" field.\n\n${formatHeadlinesForPrompt(headlines)}`
    : 'No RSS headlines were available. Generate upbeat, positive stories inspired by real events. Mark source as "Inspired by real events".';

  const prompt = `You are writing a morning newspaper for a 3-year-old child in ${CITY}.
Today is ${today}.

${headlinesContext}

RULES:
- Only pick POSITIVE, wholesome, wonder-filled stories. Nothing scary, violent, political, or sad.
- Headlines: max 7 words, active and fun.
- Body: max 2 short sentences a toddler could follow. Use very simple words.
- Include a fun question for each story to spark conversation.
- Also provide today's weather for ${CITY} (Fahrenheit), a fun fact, and an activity suggestion.

Return ONLY valid JSON. No markdown. No code fences.
{
  "weather": {"emoji": "sun/cloud/rain/snow/fog/wind", "desc": "one word", "temp": "number"},
  "local": {"headline": "", "body": "", "question": "", "source": "URL"},
  "national": {"headline": "", "body": "", "question": "", "source": "URL"},
  "world": {"headline": "", "body": "", "question": "", "source": "URL"},
  "funFact": "one fun sentence",
  "activity": "one activity suggestion tied to today's weather or news"
}`;

  const res = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that writes kid-friendly news based on real headlines. Always respond with valid JSON only. Only select positive, upbeat stories appropriate for young children.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI Gateway error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const jsonStr = data.choices?.[0]?.message?.content || '';
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse news response');
  return JSON.parse(jsonMatch[0]);
}

async function selectColoringImage(supabase: any): Promise<any | null> {
  const { data: illustrations, error } = await supabase
    .from('illustrations')
    .select('*')
    .eq('type', 'coloring')
    .order('last_used', { ascending: true, nullsFirst: true });

  if (error || !illustrations || illustrations.length === 0) {
    console.error('Failed to fetch illustrations:', error);
    return null;
  }

  const selected = illustrations[0];

  await supabase
    .from('illustrations')
    .update({ last_used: new Date().toISOString() })
    .eq('id', selected.id);

  const { data: urlData } = supabase.storage
    .from('illustrations')
    .getPublicUrl(selected.storage_path);

  return {
    id: selected.id,
    url: urlData.publicUrl,
    tags: selected.tags || [],
    caption: selected.caption || undefined,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const now = new Date();
    const ptDateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
    const displayDate = now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      timeZone: 'America/Los_Angeles',
    });

    console.log(`Generating edition for ${ptDateStr}...`);

    // Fetch RSS headlines, events, and coloring image in parallel
    const [headlines, events, coloringImage] = await Promise.all([
      fetchRSSHeadlines(),
      fetchEvents(),
      selectColoringImage(supabase),
    ]);

    console.log(`RSS headlines fetched — local: ${headlines.local.length}, national: ${headlines.national.length}, world: ${headlines.world.length}`);

    // Pass real headlines to AI for kid-friendly rewriting
    const news = await fetchNews(headlines);

    const editionData = {
      childName: 'Neighbor',
      date: displayDate,
      weather: {
        ...news.weather,
        emoji: getWeatherEmoji(news.weather.emoji),
      },
      local: news.local,
      national: news.national,
      world: news.world,
      funFact: news.funFact,
      activity: news.activity,
      events: events.length > 0 ? events : [
        { time: 'All day', name: 'No events listed today', place: NEIGHBORHOOD },
      ],
      coloringImage: coloringImage || undefined,
    };

    const { error: upsertError } = await supabase
      .from('daily_editions')
      .upsert(
        { edition_date: ptDateStr, data: editionData },
        { onConflict: 'edition_date' }
      );

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      throw new Error(`Failed to save edition: ${upsertError.message}`);
    }

    console.log(`Edition for ${ptDateStr} saved successfully.`);

    return new Response(
      JSON.stringify({ success: true, edition_date: ptDateStr }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('generate-daily-edition error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
