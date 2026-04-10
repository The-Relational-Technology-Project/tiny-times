export interface TinyTimesConfig {
  childName: string;
  city: string;
  neighborhood: string;
  eventsApiUrl: string;
  anthropicApiKey: string;
  openaiApiKey: string;
}

export interface WeatherData {
  emoji: string;
  desc: string;
  temp: string;
}

export interface NewsStory {
  headline: string;
  body: string;
  question: string;
  source: string;
}

export interface EventItem {
  time: string;
  name: string;
  place: string;
}

export interface NewspaperData {
  childName: string;
  date: string;
  weather: WeatherData;
  local: NewsStory;
  national: NewsStory;
  world: NewsStory;
  funFact: string;
  activity: string;
  events: EventItem[];
  coloringImageUrl?: string;
  cartoonImageUrl?: string;
  cartoonCaption: string;
}

export type GenerationStep =
  | 'idle'
  | 'fetching-events'
  | 'fetching-news'
  | 'generating-images'
  | 'done'
  | 'error';
