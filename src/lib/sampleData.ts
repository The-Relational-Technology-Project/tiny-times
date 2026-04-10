import { NewspaperData } from './types';

export const sampleData: NewspaperData = {
  childName: "Teddy",
  date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
  weather: { emoji: "🌧️", desc: "Rainy", temp: "64" },
  local: {
    headline: "Pink Flowers Bloom in Japantown!",
    body: "San Francisco's Japantown is getting ready for a big cherry blossom party this weekend! There will be drums, dancing, yummy food, and pretty pink flowers everywhere.",
    question: "What is your favorite color of flower?",
    source: "SFTravel"
  },
  national: {
    headline: "Astronauts Splash Down From Moon!",
    body: "Four brave astronauts flew all the way around the Moon and are coming home today! They will land in the big ocean near California.",
    question: "If you went to the Moon, what would you bring?",
    source: "NASA / CBS News"
  },
  world: {
    headline: "The Ocean Gets A Big Safe Hug!",
    body: "People all over the world are protecting more of the ocean than ever before! Now fish and sea animals have more safe places to live.",
    question: "What is your favorite sea animal?",
    source: "Positive News / UNEP"
  },
  funFact: "A whale's heart is so big that a tiny child could crawl inside it like a little cave!",
  activity: "Put on your raincoat and go jump in a puddle outside!",
  events: [
    { time: "3:00 PM", name: "CRAFTCHELLA W1", place: "Sunset Commons" },
    { time: "7:00 PM", name: "Write & Delight: Calligraphy for Beginners", place: "Sunset Commons" },
    { time: "8:00 PM", name: "Art Show Opening: Hawaiian Comfort", place: "Blackbird Cafe" }
  ],
};
