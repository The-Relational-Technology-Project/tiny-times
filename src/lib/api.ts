const WEATHER_PROMPTS: Record<string, string> = {
  sun: 'Wear your sunhat!',
  cloud: 'Maybe bring a jacket!',
  rain: 'Grab your raincoat!',
  snow: 'Bundle up warm!',
  fog: 'It\'s a mystery morning!',
  wind: 'Hold onto your hat!',
};

export function getWeatherPrompt(key: string): string {
  return WEATHER_PROMPTS[key?.toLowerCase()] || 'Have a great day!';
}
