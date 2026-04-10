import { TinyTimesConfig, EventItem, NewspaperData } from './types';

const WEATHER_EMOJIS: Record<string, string> = {
  sun: '☀️', cloud: '☁️', rain: '🌧️', snow: '❄️', fog: '🌫️', wind: '💨',
};

const WEATHER_PROMPTS: Record<string, string> = {
  sun: 'Wear your sunhat!',
  cloud: 'Maybe bring a jacket!',
  rain: 'Grab your raincoat!',
  snow: 'Bundle up warm!',
  fog: 'It\'s a mystery morning!',
  wind: 'Hold onto your hat!',
};

export function getWeatherEmoji(key: string): string {
  return WEATHER_EMOJIS[key?.toLowerCase()] || '🌤️';
}

export function getWeatherPrompt(key: string): string {
  return WEATHER_PROMPTS[key?.toLowerCase()] || 'Have a great day!';
}

export async function fetchEvents(apiUrl: string): Promise<EventItem[]> {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 19);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString().slice(0, 19);
    
    const url = `${apiUrl}?start_after=${todayStart}&start_before=${todayEnd}&limit=5`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Events API failed');
    
    const data = await res.json();
    return (data.events || []).map((e: any) => ({
      time: new Date(e.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      name: e.name,
      place: e.location?.name || 'TBD',
    }));
  } catch (err) {
    console.error('Failed to fetch events:', err);
    return [];
  }
}

export async function fetchNewsAndWeather(config: TinyTimesConfig): Promise<{
  weather: any;
  local: any;
  national: any;
  world: any;
  funFact: string;
  activity: string;
  coloringPrompt: string;
  cartoonPrompt: string;
  cartoonCaption: string;
}> {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const prompt = `You are writing a morning newspaper for a 3-year-old child in ${config.city}.
Use very simple words and short sentences. Today is ${today}.

Search the web for:
1. Today's weather in ${config.city}: Fahrenheit temp + one-word description.
2. One upbeat local ${config.city} story from the last 24 hours.
3. One upbeat US national story from the last 24 hours.
4. One upbeat world/global story from the last 24 hours.

For each story: max 2 short sentences a toddler could follow.
Headlines: max 7 words, active and fun.
Only positive, wonder-filled stories. Nothing scary.

Also provide:
- coloring_prompt: a detailed prompt for generating a coloring page image related to the local story. Describe the scene simply. Specify "black and white line drawing, coloring book style, thick outlines, no shading, no gray, white background, simple and cute, designed for a 3-year-old to color in"
- cartoon_prompt: a prompt for generating a New Yorker-style single-panel cartoon. Describe a funny scene with cute animals in an absurd everyday situation, loosely inspired by today's news. Specify "black and white line drawing, New Yorker cartoon style, single panel, clean lines, no shading, white background, with a speech bubble or caption area"
- cartoon_caption: a short witty caption for the cartoon (funny for parents, delightful for toddlers)

Return ONLY valid JSON. No markdown. No code fences.
{
  "weather": {"emoji": "sun/cloud/rain/snow/fog/wind", "desc": "one word", "temp": "number"},
  "local": {"headline": "", "body": "", "question": "", "source": ""},
  "national": {"headline": "", "body": "", "question": "", "source": ""},
  "world": {"headline": "", "body": "", "question": "", "source": ""},
  "funFact": "one fun sentence",
  "activity": "one activity suggestion tied to today's weather or news",
  "coloring_prompt": "detailed image generation prompt",
  "cartoon_prompt": "detailed image generation prompt",
  "cartoon_caption": "the funny caption"
}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': config.anthropicApiKey,
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
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
    throw new Error(`Anthropic API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  
  // Extract text content from the response
  let jsonStr = '';
  for (const block of data.content || []) {
    if (block.type === 'text') {
      jsonStr += block.text;
    }
  }
  
  // Try to parse JSON from the text
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not find JSON in Anthropic response');
  
  const parsed = JSON.parse(jsonMatch[0]);
  return {
    weather: {
      ...parsed.weather,
      emoji: getWeatherEmoji(parsed.weather.emoji),
    },
    local: parsed.local,
    national: parsed.national,
    world: parsed.world,
    funFact: parsed.funFact,
    activity: parsed.activity,
    coloringPrompt: parsed.coloring_prompt,
    cartoonPrompt: parsed.cartoon_prompt,
    cartoonCaption: parsed.cartoon_caption,
  };
}

export async function generateImage(
  apiKey: string,
  prompt: string,
  size: string = '1024x1024'
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size,
      quality: 'medium',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  // gpt-image-1 returns base64
  const b64 = data.data?.[0]?.b64_json;
  if (b64) return `data:image/png;base64,${b64}`;
  
  const url = data.data?.[0]?.url;
  if (url) return url;
  
  throw new Error('No image data in OpenAI response');
}

export async function generateNewspaper(
  config: TinyTimesConfig,
  onStep: (step: string) => void
): Promise<NewspaperData> {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Step 1: Fetch events
  onStep('fetching-events');
  const events = await fetchEvents(config.eventsApiUrl);

  // Step 2: Fetch news + weather
  onStep('fetching-news');
  const news = await fetchNewsAndWeather(config);

  // Step 3: Generate images in parallel
  onStep('generating-images');
  const [coloringImageUrl, cartoonImageUrl] = await Promise.allSettled([
    generateImage(config.openaiApiKey, news.coloringPrompt, '1024x1024'),
    generateImage(config.openaiApiKey, news.cartoonPrompt, '1536x1024'),
  ]);

  return {
    childName: config.childName,
    date: today,
    weather: news.weather,
    local: news.local,
    national: news.national,
    world: news.world,
    funFact: news.funFact,
    activity: news.activity,
    events: events.length > 0 ? events : [
      { time: 'All day', name: 'No events listed today', place: config.neighborhood }
    ],
    coloringImageUrl: coloringImageUrl.status === 'fulfilled' ? coloringImageUrl.value : undefined,
    cartoonImageUrl: cartoonImageUrl.status === 'fulfilled' ? cartoonImageUrl.value : undefined,
    cartoonCaption: news.cartoonCaption,
  };
}
