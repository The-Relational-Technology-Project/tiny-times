import { useState } from 'react';
import { TinyTimesConfig } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DEFAULT_EVENTS_URL = 'https://nawdvulumebqbxmkedzw.supabase.co/functions/v1/get-public-events';

interface ConfigScreenProps {
  onSave: (config: TinyTimesConfig) => void;
  initialConfig?: TinyTimesConfig | null;
}

export function ConfigScreen({ onSave, initialConfig }: ConfigScreenProps) {
  const [childName, setChildName] = useState(initialConfig?.childName || '');
  const [city, setCity] = useState(initialConfig?.city || 'San Francisco');
  const [neighborhood, setNeighborhood] = useState(initialConfig?.neighborhood || 'Outer Sunset');
  const [eventsApiUrl, setEventsApiUrl] = useState(initialConfig?.eventsApiUrl || DEFAULT_EVENTS_URL);

  const isValid = childName.trim() && city.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSave({
      childName: childName.trim(),
      city: city.trim(),
      neighborhood: neighborhood.trim() || 'Outer Sunset',
      eventsApiUrl: eventsApiUrl.trim() || DEFAULT_EVENTS_URL,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-primary mb-2">The Tiny Times</h1>
          <p className="font-body text-muted-foreground text-lg">
            A daily newspaper, just for your little one ✨
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-popover rounded-xl p-6 shadow-lg border border-border">
          <div className="space-y-2">
            <Label htmlFor="childName" className="font-body font-semibold">Child's Name *</Label>
            <Input
              id="childName"
              value={childName}
              onChange={e => setChildName(e.target.value)}
              placeholder="Teddy"
              className="font-body"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city" className="font-body font-semibold">City *</Label>
              <Input
                id="city"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="San Francisco"
                className="font-body"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood" className="font-body font-semibold">Neighborhood</Label>
              <Input
                id="neighborhood"
                value={neighborhood}
                onChange={e => setNeighborhood(e.target.value)}
                placeholder="Outer Sunset"
                className="font-body"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventsUrl" className="font-body font-semibold">Events API URL</Label>
            <Input
              id="eventsUrl"
              value={eventsApiUrl}
              onChange={e => setEventsApiUrl(e.target.value)}
              placeholder={DEFAULT_EVENTS_URL}
              className="font-body text-xs"
            />
            <p className="text-xs text-muted-foreground">Default: Outer Sunset community calendar</p>
          </div>

          <Button type="submit" disabled={!isValid} className="w-full font-display text-lg h-12">
            Start Reading 📰
          </Button>
        </form>
      </div>
    </div>
  );
}
