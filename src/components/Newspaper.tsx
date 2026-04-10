import { useState } from 'react';
import { NewspaperData, TinyTimesConfig } from '@/lib/types';
import { sampleData } from '@/lib/sampleData';
import { generateNewspaper, getWeatherPrompt } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Settings, Printer, RefreshCw, Loader2, Star, Lightbulb, Calendar, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NewspaperProps {
  config: TinyTimesConfig;
  onEditConfig: () => void;
}

const STEP_LABELS: Record<string, string> = {
  'fetching-events': '📅 Finding neighborhood events…',
  'fetching-news': '📰 Gathering today\'s news…',
  'selecting-illustrations': '🎨 Picking today\'s illustrations…',
};

export function Newspaper({ config, onEditConfig }: NewspaperProps) {
  const [data, setData] = useState<NewspaperData>({ ...sampleData, childName: config.childName });
  const [step, setStep] = useState<string>('idle');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    setStep('fetching-events');
    setError(null);
    try {
      const result = await generateNewspaper(config, setStep);
      setData(result);
      setHasGenerated(true);
      setStep('done');
    } catch (err: any) {
      console.error('Generation failed:', err);
      setError(err.message || 'Something went wrong');
      setStep('error');
    }
  };

  const handlePrint = () => window.print();

  const isLoading = step !== 'idle' && step !== 'done' && step !== 'error';

  return (
    <div className="min-h-screen bg-muted pb-8">
      {/* Controls bar */}
      <div className="no-print sticky top-0 z-50 bg-popover/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xl text-primary">The Tiny Times</h1>
          {!hasGenerated && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Preview</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <span className="text-sm text-muted-foreground font-body flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {STEP_LABELS[step] || 'Working…'}
            </span>
          )}
          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            size="sm"
            className="font-body font-semibold"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Generate
          </Button>
          <Button onClick={handlePrint} variant="outline" size="sm" className="font-body">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button onClick={() => navigate('/library')} variant="outline" size="sm" className="font-body">
            <BookOpen className="h-4 w-4" />
            Library
          </Button>
          <Button onClick={onEditConfig} variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="no-print max-w-[8.5in] mx-auto mt-4 px-4">
          <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm font-body">
            ⚠️ {error}
          </div>
        </div>
      )}

      {/* Newspaper page */}
      <div className="newspaper-page mt-6 p-[0.35in] overflow-hidden" style={{ background: 'white' }}>
        {/* Masthead */}
        <div className="text-center pb-2 mb-1 border-b-4 border-double" style={{ borderColor: 'hsl(var(--masthead))' }}>
          <div className="flex items-center justify-center gap-2 mb-0.5">
            <div className="h-px flex-1" style={{ background: 'hsl(var(--masthead))' }} />
            <span className="text-[10px] font-body font-semibold tracking-[0.2em] uppercase" style={{ color: 'hsl(var(--masthead))' }}>
              Est. 2026 · Your Daily Newspaper
            </span>
            <div className="h-px flex-1" style={{ background: 'hsl(var(--masthead))' }} />
          </div>
          <h1 className="font-display text-[42px] leading-none tracking-tight" style={{ color: 'hsl(var(--masthead))' }}>
            The Tiny Times
          </h1>
          <div className="flex items-center justify-center gap-3 mt-1">
            <span className="text-xs font-body" style={{ color: 'hsl(var(--muted-foreground))' }}>{data.date}</span>
            <span style={{ color: 'hsl(var(--masthead-accent))' }}>★</span>
            <span className="text-xs font-body font-bold" style={{ color: 'hsl(var(--masthead))' }}>
              Good Morning, {data.childName}!
            </span>
          </div>
        </div>

        {/* Weather strip */}
        <div className="flex items-center justify-center gap-3 py-1.5 px-3 rounded-md my-1.5 text-sm" style={{ background: 'hsl(var(--weather-bg))' }}>
          <span className="text-lg">{data.weather.emoji}</span>
          <span className="font-body font-bold" style={{ color: 'hsl(var(--weather-foreground))' }}>
            {data.weather.temp}°F · {data.weather.desc}
          </span>
          <span className="font-body text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {getWeatherPrompt(data.weather.desc?.toLowerCase())}
          </span>
        </div>

        {/* Main content: 3 stories */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <StoryBlock category={`${config.city} News`} story={data.local} colorVar="story-local" />
          <StoryBlock category="Our Country" story={data.national} colorVar="story-national" />
          <StoryBlock category="Our World" story={data.world} colorVar="story-world" />
        </div>

        {/* Middle row: Coloring + Events + Fun Fact + Activity */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          {/* Coloring page */}
          <div className="border rounded-md overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="text-[9px] font-display text-center py-0.5" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
              ✏️ Color Me In!
            </div>
            {data.coloringImage?.url ? (
              <img src={data.coloringImage.url} alt="Coloring page" className="w-full aspect-square object-contain" />
            ) : (
              <div className="w-full aspect-square flex items-center justify-center bg-muted/30">
                <span className="text-3xl">🖍️</span>
              </div>
            )}
          </div>

          {/* Events */}
          <div className="rounded-md p-2" style={{ background: 'hsl(var(--events-bg))' }}>
            <div className="flex items-center gap-1 mb-1.5">
              <Calendar className="h-3 w-3" style={{ color: 'hsl(var(--masthead))' }} />
              <span className="font-display text-[11px]" style={{ color: 'hsl(var(--masthead))' }}>
                {config.neighborhood} Today
              </span>
            </div>
            <div className="space-y-1.5">
              {data.events.map((event, i) => (
                <div key={i} className="text-[9px] font-body leading-tight">
                  <span className="font-bold">{event.time}</span>
                  <br />
                  <span>{event.name}</span>
                  <br />
                  <span className="text-muted-foreground">{event.place}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fun fact + Activity */}
          <div className="space-y-2">
            <div className="rounded-md p-2" style={{ background: 'hsl(var(--story-world-bg))' }}>
              <div className="flex items-center gap-1 mb-1">
                <Star className="h-3 w-3" style={{ color: 'hsl(var(--story-world))' }} />
                <span className="font-display text-[11px]" style={{ color: 'hsl(var(--story-world))' }}>Fun Fact</span>
              </div>
              <p className="text-[10px] font-body leading-snug">{data.funFact}</p>
            </div>
            <div className="rounded-md p-2" style={{ background: 'hsl(var(--story-local-bg))' }}>
              <div className="flex items-center gap-1 mb-1">
                <Lightbulb className="h-3 w-3" style={{ color: 'hsl(var(--story-local))' }} />
                <span className="font-display text-[11px]" style={{ color: 'hsl(var(--story-local))' }}>Today's Activity</span>
              </div>
              <p className="text-[10px] font-body leading-snug">{data.activity}</p>
            </div>
          </div>
        </div>

        {/* Cartoon */}
        <div className="mt-2 border rounded-md overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="text-[9px] font-display text-center py-0.5" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
            Today's Cartoon
          </div>
          {data.cartoonImage?.url ? (
            <img src={data.cartoonImage.url} alt="Daily cartoon" className="w-full max-h-[2in] object-contain" />
          ) : (
            <div className="w-full h-[1.5in] flex items-center justify-center bg-muted/30">
              <span className="text-3xl">🐻</span>
            </div>
          )}
          <p className="text-center font-caption italic text-[11px] py-1 px-4" style={{ color: 'hsl(var(--foreground))' }}>
            {data.cartoonCaption}
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-2 pt-1 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <p className="text-[8px] font-body text-muted-foreground">
            The Tiny Times · {config.city} · Events: outersunset.today (CC BY 4.0)
          </p>
        </div>
      </div>
    </div>
  );
}

function StoryBlock({ category, story, colorVar }: { category: string; story: any; colorVar: string }) {
  return (
    <div className="rounded-md overflow-hidden border" style={{ borderColor: `hsl(var(--${colorVar}))`, borderWidth: '1px' }}>
      <div className="px-2 py-0.5" style={{ background: `hsl(var(--${colorVar}))` }}>
        <span className="text-[9px] font-display text-white tracking-wide uppercase">{category}</span>
      </div>
      <div className="p-2" style={{ background: `hsl(var(--${colorVar}-bg))` }}>
        <h3 className="font-display text-[13px] leading-tight mb-1" style={{ color: `hsl(var(--${colorVar}))` }}>
          {story.headline}
        </h3>
        <p className="text-[10px] font-body leading-snug mb-1.5">{story.body}</p>
        <p className="text-[9px] font-body italic" style={{ color: `hsl(var(--${colorVar}))` }}>
          💬 {story.question}
        </p>
        <p className="text-[7px] font-body text-muted-foreground mt-1">Source: {story.source}</p>
      </div>
    </div>
  );
}
