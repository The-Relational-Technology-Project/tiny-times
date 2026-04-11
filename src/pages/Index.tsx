import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NewspaperData } from '@/lib/types';
import { Newspaper } from '@/components/Newspaper';
import { Loader2 } from 'lucide-react';

export default function Index() {
  const [data, setData] = useState<NewspaperData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTodaysEdition() {
      try {
        // Get today's date in PT timezone
        const now = new Date();
        const ptDate = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

        const { data: edition, error: fetchError } = await supabase
          .from('daily_editions')
          .select('data')
          .eq('edition_date', ptDate)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (edition) {
          setData(edition.data as unknown as NewspaperData);
        } else {
          setError('preparing');
        }
      } catch (err: any) {
        console.error('Failed to load edition:', err);
        setError(err.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    }

    loadTodaysEdition();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="font-body text-muted-foreground">Loading today's edition…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <h1 className="font-display text-4xl text-primary mb-3">The Tiny Times</h1>
          <p className="font-body text-lg text-muted-foreground mb-2">
            ☕ Today's edition is being prepared…
          </p>
          <p className="font-body text-sm text-muted-foreground">
            Check back shortly! A fresh newspaper is generated each morning at 1am.
          </p>
        </div>
      </div>
    );
  }

  return <Newspaper data={data} />;
}
