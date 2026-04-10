import { TinyTimesConfig, EventItem, NewspaperData } from './types';
import { supabase } from '@/integrations/supabase/client';
import { extractKeywords, selectIllustration } from './illustrations';

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
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    // Use plain date strings to avoid timezone conversion issues
    const todayStart = `${yyyy}-${mm}-${dd}T00:00:00`;
    const todayEnd = `${yyyy}-${mm}-${dd}T23:59:59`;

    const url = `${apiUrl}?start_after=${todayStart}&start_before=${todayEnd}&limit=3`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Events API failed');

    const data = await res.json();
    return (data.events || []).slice(0, 3).map((e: any) => ({
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
}> {
  const { data, error } = await supabase.functions.invoke('generate-news', {
    body: {
      city: config.city,
      childName: config.childName,
    },
  });

  if (error) throw new Error(`News generation failed: ${error.message}`);

  return {
    weather: {
      ...data.weather,
      emoji: getWeatherEmoji(data.weather.emoji),
    },
    local: data.local,
    national: data.national,
    world: data.world,
    funFact: data.funFact,
    activity: data.activity,
  };
}

export async function generateNewspaper(
  config: TinyTimesConfig,
  onStep: (step: string) => void
): Promise<NewspaperData> {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Step 1: Fetch events + select illustration in parallel
  onStep('fetching-events');
  const [events, coloringImage] = await Promise.all([
    fetchEvents(config.eventsApiUrl),
    selectIllustration('coloring', []).catch(() => null),
  ]);

  // Step 2: Fetch news + weather via edge function
  onStep('fetching-news');
  const news = await fetchNewsAndWeather(config);

  // Step 3: If we got news, try to pick a more relevant illustration
  onStep('selecting-illustrations');
  let finalImage = coloringImage;
  try {
    const keywords = extractKeywords([news.local, news.national, news.world]);
    if (keywords.length > 0) {
      const betterMatch = await selectIllustration('coloring', keywords);
      if (betterMatch) finalImage = betterMatch;
    }
  } catch {
    // Keep the early pick
  }

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
    coloringImage: finalImage || undefined,
  };
}
