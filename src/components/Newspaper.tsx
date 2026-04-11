import { useState, useEffect } from 'react';
import { NewspaperData } from '@/lib/types';
import { getWeatherPrompt } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Printer, Info, Star, Lightbulb, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import iconCitySf from '@/assets/icon-city-sf.png';
import iconCountryUsa from '@/assets/icon-country-usa.png';
import iconWorldEarth from '@/assets/icon-world-earth.png';

interface NewspaperProps {
  data: NewspaperData;
}

const SECTION_ICONS: Record<string, string> = {
  'story-local': iconCitySf,
  'story-national': iconCountryUsa,
  'story-world': iconWorldEarth,
};

const NAME_KEY = 'tiny-times-name';

function loadName(): string {
  return localStorage.getItem(NAME_KEY) || 'Neighbor';
}

function saveName(name: string) {
  localStorage.setItem(NAME_KEY, name);
}

export function Newspaper({ data }: NewspaperProps) {
  const [name, setName] = useState(loadName);
  const navigate = useNavigate();

  useEffect(() => {
    saveName(name);
  }, [name]);

  // Set CSS variable for mobile scaling
  useEffect(() => {
    function updateScale() {
      const scale = Math.min(1, window.innerWidth / (8.5 * 96)); // 8.5in at 96dpi
      document.documentElement.style.setProperty('--mobile-scale', String(scale));
    }
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const handlePrint = () => window.print();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleNameBlur = () => {
    if (!name.trim()) setName('Neighbor');
  };

  return (
    <div className="min-h-screen bg-muted pb-8 print:bg-white print:pb-0 print:min-h-0">
      {/* Controls bar */}
      <div className="no-print sticky top-0 z-50 bg-popover/95 backdrop-blur border-b border-border px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
        <h1 className="font-display text-base sm:text-xl text-primary">The Tiny Times</h1>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button onClick={handlePrint} size="sm" className="font-body font-semibold text-xs sm:text-sm px-2 sm:px-3">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </Button>
          <Button onClick={() => navigate('/about')} variant="ghost" size="sm" className="font-body text-xs sm:text-sm px-2 sm:px-3">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">About</span>
          </Button>
        </div>
      </div>

      {/* Mobile: scrollable/zoomable PDF-like container; Desktop: normal flow */}
      <div className="sm:contents">
        <div className="sm:hidden no-print px-3 py-2 text-center text-xs text-muted-foreground font-body">
          Pinch to zoom · Scroll to read
        </div>
        <div className="newspaper-mobile-wrap sm:contents overflow-x-auto">

      {/* ===== PAGE 1: Front ===== */}
      <div className="newspaper-page newspaper-page-front mt-6 p-[0.4in]" style={{ background: 'white' }}>
        {/* Masthead */}
        <div className="text-center pb-3 mb-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="h-px flex-1 bg-foreground/20" />
            <span className="text-[10px] font-body font-semibold tracking-[0.2em] uppercase text-muted-foreground">
              Est. 2026 · Your Daily Newspaper
            </span>
            <div className="h-px flex-1 bg-foreground/20" />
          </div>
          <h1 className="font-display text-[56px] leading-none tracking-tight" style={{ color: 'hsl(var(--masthead))' }}>
            The Tiny Times
          </h1>
          <p className="text-sm font-display tracking-wide uppercase mt-1" style={{ color: 'hsl(var(--masthead))' }}>
            ✦ The Outer Sunset Edition ✦
          </p>
          <div className="flex items-center justify-center gap-3 mt-1.5 text-sm font-body text-muted-foreground">
            <span>{data.date}</span>
          </div>
          {/* Inline-editable greeting */}
          <div className="font-display text-[28px] mt-2 leading-tight flex items-center justify-center gap-2" style={{ color: 'hsl(var(--masthead))' }}>
            <span>Good Morning,</span>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              className="font-display text-[28px] leading-tight bg-transparent border-b-2 border-dashed border-primary/30 focus:border-primary outline-none text-center print:border-none"
              style={{ color: 'hsl(var(--masthead))', width: `${Math.max(name.length, 3) + 1}ch` }}
            />
            <span>☀️</span>
          </div>
          <p className="no-print text-[10px] text-muted-foreground mt-1 font-body">Click the name above to personalize</p>
          <div className="h-[2px] mt-3 bg-foreground/15" />
        </div>

        {/* Weather strip */}
        <div className="flex items-center justify-center gap-3 pb-3 mb-3 border-b border-foreground/10">
          <span className="text-2xl">{data.weather.emoji}</span>
          <span className="font-display text-base">
            {data.weather.temp}°F · {data.weather.desc}
          </span>
          <span className="font-body text-sm text-muted-foreground">
            {getWeatherPrompt(data.weather.desc?.toLowerCase())}
          </span>
        </div>

        {/* Stories */}
        <div className="grid grid-cols-2 gap-5 mb-3">
          <StoryBlock category="San Francisco News" story={data.local} colorVar="story-local" />
          <StoryBlock category="Our Country" story={data.national} colorVar="story-national" />
        </div>
        <div className="mb-3">
          <StoryBlock category="Our World" story={data.world} colorVar="story-world" />
        </div>

        {/* Bottom row */}
        <div className="h-px bg-foreground/10 mb-3" />
        <div className="grid grid-cols-3 gap-5">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Calendar className="h-4 w-4" style={{ color: 'hsl(var(--masthead))' }} />
              <span className="font-display text-[13px]" style={{ color: 'hsl(var(--masthead))' }}>
                Outer Sunset Today
              </span>
            </div>
            <div className="space-y-1.5">
              {data.events.map((event, i) => (
                <div key={i} className="text-[11px] font-body leading-snug">
                  <span className="font-bold">{event.time}</span>
                  <br />
                  <span>{event.name}</span>
                  <br />
                  <span className="text-muted-foreground">{event.place}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Star className="h-4 w-4" style={{ color: 'hsl(var(--story-world))' }} />
              <span className="font-display text-[13px]" style={{ color: 'hsl(var(--story-world))' }}>Fun Fact</span>
            </div>
            <p className="text-[12px] font-body leading-relaxed">{data.funFact}</p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Lightbulb className="h-4 w-4" style={{ color: 'hsl(var(--story-local))' }} />
              <span className="font-display text-[13px]" style={{ color: 'hsl(var(--story-local))' }}>Today's Activity</span>
            </div>
            <p className="text-[12px] font-body leading-relaxed">{data.activity}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-3 pt-1.5 border-t border-foreground/10">
          <p className="text-[9px] font-body text-muted-foreground">
            The Tiny Times · San Francisco · Events: outersunset.today (CC BY 4.0)
          </p>
        </div>
      </div>

      {/* ===== PAGE 2: Coloring Page ===== */}
      <div className="newspaper-page newspaper-page-back mt-6 p-[0.4in] flex flex-col" style={{ background: 'white' }}>
        <div className="text-center mb-4">
          <h2 className="font-display text-[36px] leading-none" style={{ color: 'hsl(var(--masthead))' }}>
            ✏️ Color Me In!
          </h2>
          <p className="font-body text-sm mt-1 text-muted-foreground">
            Grab your crayons and make this picture beautiful!
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-2xl overflow-hidden border-foreground/20">
          {data.coloringImage?.url ? (
            <img src={data.coloringImage.url} alt="Coloring page" className="w-full h-full object-contain p-4" />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <span className="text-6xl">🖍️</span>
              <span className="font-body text-sm">Coloring page will appear here</span>
            </div>
          )}
        </div>

        <div className="text-center mt-4 pt-2 border-t border-foreground/10">
          <p className="text-[9px] font-body text-muted-foreground">
            The Tiny Times · San Francisco · Made with ❤️ for {name}
          </p>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
}

function StoryBlock({ category, story, colorVar }: { category: string; story: any; colorVar: string }) {
  const icon = SECTION_ICONS[colorVar];

  return (
    <div className="flex gap-3">
      {icon && (
        <img
          src={icon}
          alt=""
          className="w-12 h-12 object-contain flex-shrink-0 mt-0.5"
          loading="lazy"
          width={48}
          height={48}
        />
      )}
      <div className="flex-1">
        <span className="text-[11px] font-display tracking-wide uppercase font-bold" style={{ color: `hsl(var(--${colorVar}))` }}>
          {category}
        </span>
        <h3 className="font-display text-[18px] leading-tight mt-0.5 mb-1" style={{ color: `hsl(var(--${colorVar}))` }}>
          {story.headline}
        </h3>
        <p className="text-[13px] font-body leading-relaxed mb-1.5">{story.body}</p>
        <p className="text-[11px] font-body italic" style={{ color: `hsl(var(--${colorVar}))` }}>
          💬 {story.question}
        </p>
        <p className="text-[8px] font-body text-muted-foreground mt-0.5">Source: {story.source}</p>
      </div>
    </div>
  );
}
