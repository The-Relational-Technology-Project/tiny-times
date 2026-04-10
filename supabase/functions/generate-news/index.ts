const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { city, childName } = await req.json();
    if (!city || !childName) {
      return new Response(
        JSON.stringify({ error: 'city and childName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const prompt = `You are writing a morning newspaper for a 3-year-old child in ${city}.
Use very simple words and short sentences. Today is ${today}.

Search the web for:
1. Today's weather in ${city}: Fahrenheit temp + one-word description.
2. One upbeat local ${city} story from the last 24 hours.
3. One upbeat US national story from the last 24 hours.
4. One upbeat world/global story from the last 24 hours.

For each story: max 2 short sentences a toddler could follow.
Headlines: max 7 words, active and fun.
Only positive, wonder-filled stories. Nothing scary.

Also provide:
- cartoon_caption: a short witty caption for a daily cartoon (funny for parents, delightful for toddlers)

Return ONLY valid JSON. No markdown. No code fences.
{
  "weather": {"emoji": "sun/cloud/rain/snow/fog/wind", "desc": "one word", "temp": "number"},
  "local": {"headline": "", "body": "", "question": "", "source": ""},
  "national": {"headline": "", "body": "", "question": "", "source": ""},
  "world": {"headline": "", "body": "", "question": "", "source": ""},
  "funFact": "one fun sentence",
  "activity": "one activity suggestion tied to today's weather or news",
  "cartoon_caption": "the funny caption"
}`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${res.status}`, details: errText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await res.json();

    // Extract text content
    let jsonStr = '';
    for (const block of data.content || []) {
      if (block.type === 'text') {
        jsonStr += block.text;
      }
    }

    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: 'Could not parse news response' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
