import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.103.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const EVENTS_API_URL = 'https://nawdvulumebqbxmkedzw.supabase.co/functions/v1/get-public-events';
const CITY = 'San Francisco';
const NEIGHBORHOOD = 'Outer Sunset';

const WEATHER_EMOJIS: Record<string, string> = {
  sun: '☀️', cloud: '☁️', rain: '🌧️', snow: '❄️', fog: '🌫️', wind: '💨',
};

function getWeatherEmoji(key: string): string {
  return WEATHER_EMOJIS[key?.toLowerCase()] || '🌤️';
}

async function fetchEvents(): Promise<any[]> {
  try {
    const now = new Date();
    // Use PT timezone for date calculation
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
      time: new Date(e.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      name: e.name,
      place: e.location?.name || 'TBD',
    }));
  } catch (err) {
    console.error('Failed to fetch events:', err);
    return [];
  }
}

async function fetchNews(): Promise<any> {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/Los_Angeles',
  });

  const prompt = `You are writing a morning newspaper for a 3-year-old child in ${CITY}.
Use very simple words and short sentences. Today is ${today}.

Search the web or use your training data for:
1. Today's weather in ${CITY}: Fahrenheit temp + one-word description.
2. One upbeat local ${CITY} story from the last 24 hours.
3. One upbeat US national story from the last 24 hours.
4. One upbeat world/global story from the last 24 hours.

For each story: max 2 short sentences a toddler could follow.
Headlines: max 7 words, active and fun.
Only positive, wonder-filled stories. Nothing scary.

Return ONLY valid JSON. No markdown. No code fences.
{
  "weather": {"emoji": "sun/cloud/rain/snow/fog/wind", "desc": "one word", "temp": "number"},
  "local": {"headline": "", "body": "", "question": "", "source": ""},
  "national": {"headline": "", "body": "", "question": "", "source": ""},
  "world": {"headline": "", "body": "", "question": "", "source": ""},
  "funFact": "one fun sentence",
  "activity": "one activity suggestion tied to today's weather or news"
}`;

  const res = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that writes kid-friendly news. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${errText}`);
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

  const selected = illustrations[0]; // Least recently used

  // Update last_used
  await supabase
    .from('illustrations')
    .update({ last_used: new Date().toISOString() })
    .eq('id', selected.id);

  // Build public URL
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

    // Get today's date in PT
    const now = new Date();
    const ptDateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }); // YYYY-MM-DD
    const displayDate = now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      timeZone: 'America/Los_Angeles',
    });

    console.log(`Generating edition for ${ptDateStr}...`);

    // Fetch events, news, and coloring image in parallel
    const [events, news, coloringImage] = await Promise.all([
      fetchEvents(),
      fetchNews(),
      selectColoringImage(supabase),
    ]);

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

    // Upsert into daily_editions
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
