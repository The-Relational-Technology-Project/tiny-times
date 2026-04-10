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

  // Step 1: Fetch events
  onStep('fetching-events');
  const events = await fetchEvents(config.eventsApiUrl);

  // Step 2: Fetch news + weather via edge function
  onStep('fetching-news');
  const news = await fetchNewsAndWeather(config);

  // Step 3: Select illustrations from library
  onStep('selecting-illustrations');
  const keywords = extractKeywords([news.local, news.national, news.world]);
  const coloringImage = await selectIllustration('coloring', keywords);

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
    coloringImage: coloringImage || undefined,
  };
}
