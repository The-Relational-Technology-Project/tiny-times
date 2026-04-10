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
          <Button onClick={handleGenerate} disabled={isLoading} size="sm" className="font-body font-semibold">
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

      {/* ===== PAGE 1: Front ===== */}
      <div className="newspaper-page newspaper-page-front mt-6 p-[0.4in] overflow-hidden" style={{ background: 'white' }}>
        {/* Masthead */}
        <div className="text-center pb-3 mb-3 border-b-4 border-double" style={{ borderColor: 'hsl(var(--masthead))' }}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="h-px flex-1" style={{ background: 'hsl(var(--masthead))' }} />
            <span className="text-[11px] font-body font-semibold tracking-[0.2em] uppercase" style={{ color: 'hsl(var(--masthead))' }}>
              Est. 2026 · Your Daily Newspaper
            </span>
            <div className="h-px flex-1" style={{ background: 'hsl(var(--masthead))' }} />
          </div>
          <h1 className="font-display text-[56px] leading-none tracking-tight" style={{ color: 'hsl(var(--masthead))' }}>
            The Tiny Times
          </h1>
          <div className="mt-1.5 mb-1">
            <span className="inline-block text-sm font-display tracking-wide uppercase px-4 py-0.5 rounded-full" style={{ background: 'hsl(var(--masthead-accent))', color: 'hsl(var(--masthead-foreground))' }}>
              ✦ The {config.neighborhood} Edition ✦
            </span>
          </div>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-sm font-body" style={{ color: 'hsl(var(--muted-foreground))' }}>{data.date}</span>
            <span style={{ color: 'hsl(var(--masthead-accent))' }}>★</span>
          </div>
          <p className="font-display text-[28px] mt-2 leading-tight" style={{ color: 'hsl(var(--masthead))' }}>
            Good Morning, {data.childName}! ☀️
          </p>
        </div>

        {/* Weather strip */}
        <div className="flex items-center justify-center gap-4 py-2.5 px-4 rounded-xl my-2" style={{ background: 'hsl(var(--weather-bg))' }}>
          <span className="text-3xl">{data.weather.emoji}</span>
          <span className="font-display text-lg" style={{ color: 'hsl(var(--weather-foreground))' }}>
            {data.weather.temp}°F · {data.weather.desc}
          </span>
          <span className="font-body text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {getWeatherPrompt(data.weather.desc?.toLowerCase())}
          </span>
        </div>

        {/* Stories: 2-col top row + full-width bottom */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <StoryBlock category={`${config.city} News`} story={data.local} colorVar="story-local" />
          <StoryBlock category="Our Country" story={data.national} colorVar="story-national" />
        </div>
        <div className="mt-3">
          <StoryBlock category="Our World" story={data.world} colorVar="story-world" />
        </div>

        {/* Bottom row: Events + Fun Fact + Activity */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          {/* Events */}
          <div className="rounded-xl p-3" style={{ background: 'hsl(var(--events-bg))' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar className="h-4 w-4" style={{ color: 'hsl(var(--masthead))' }} />
              <span className="font-display text-[13px]" style={{ color: 'hsl(var(--masthead))' }}>
                {config.neighborhood} Today
              </span>
            </div>
            <div className="space-y-2">
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

          {/* Fun Fact */}
          <div className="rounded-xl p-3" style={{ background: 'hsl(var(--story-world-bg))' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Star className="h-4 w-4" style={{ color: 'hsl(var(--story-world))' }} />
              <span className="font-display text-[13px]" style={{ color: 'hsl(var(--story-world))' }}>Fun Fact</span>
            </div>
            <p className="text-[12px] font-body leading-relaxed">{data.funFact}</p>
          </div>

          {/* Activity */}
          <div className="rounded-xl p-3" style={{ background: 'hsl(var(--story-local-bg))' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb className="h-4 w-4" style={{ color: 'hsl(var(--story-local))' }} />
              <span className="font-display text-[13px]" style={{ color: 'hsl(var(--story-local))' }}>Today's Activity</span>
            </div>
            <p className="text-[12px] font-body leading-relaxed">{data.activity}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-3 pt-2 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <p className="text-[9px] font-body text-muted-foreground">
            The Tiny Times · {config.city} · Events: outersunset.today (CC BY 4.0)
          </p>
        </div>
      </div>

      {/* ===== PAGE 2: Coloring Page (Back) ===== */}
      <div className="newspaper-page newspaper-page-back mt-6 p-[0.4in] flex flex-col" style={{ background: 'white' }}>
        <div className="text-center mb-4">
          <h2 className="font-display text-[36px] leading-none" style={{ color: 'hsl(var(--masthead))' }}>
            ✏️ Color Me In!
          </h2>
          <p className="font-body text-sm mt-1 text-muted-foreground">
            Grab your crayons and make this picture beautiful!
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-2xl overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
          {data.coloringImage?.url ? (
            <img src={data.coloringImage.url} alt="Coloring page" className="w-full h-full object-contain p-4" />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <span className="text-6xl">🖍️</span>
              <span className="font-body text-sm">Coloring page will appear here</span>
            </div>
          )}
        </div>

        <div className="text-center mt-4 pt-2 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <p className="text-[9px] font-body text-muted-foreground">
            The Tiny Times · {config.city} · Made with ❤️ for {data.childName}
          </p>
        </div>
      </div>
    </div>
  );
}

function StoryBlock({ category, story, colorVar }: { category: string; story: any; colorVar: string }) {
  return (
    <div className="rounded-xl overflow-hidden border-2" style={{ borderColor: `hsl(var(--${colorVar}))` }}>
      <div className="px-3 py-1" style={{ background: `hsl(var(--${colorVar}))` }}>
        <span className="text-[11px] font-display text-white tracking-wide uppercase">{category}</span>
      </div>
      <div className="p-3" style={{ background: `hsl(var(--${colorVar}-bg))` }}>
        <h3 className="font-display text-[18px] leading-tight mb-1.5" style={{ color: `hsl(var(--${colorVar}))` }}>
          {story.headline}
        </h3>
        <p className="text-[13px] font-body leading-relaxed mb-2">{story.body}</p>
        <p className="text-[11px] font-body italic" style={{ color: `hsl(var(--${colorVar}))` }}>
          💬 {story.question}
        </p>
        <p className="text-[8px] font-body text-muted-foreground mt-1.5">Source: {story.source}</p>
      </div>
    </div>
  );
}
