const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
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

Search the web or use your training data for:
1. Today's weather in ${city}: Fahrenheit temp + one-word description.
2. One upbeat local ${city} story from the last 24 hours.
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
      console.error('AI gateway error:', res.status, errText);

      if (res.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (res.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds in Settings > Workspace > Usage.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: `AI gateway error: ${res.status}`, details: errText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await res.json();

    // Extract text from the response
    let jsonStr = data.choices?.[0]?.message?.content || '';

    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not parse news response:', jsonStr);
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
    console.error('generate-news error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
