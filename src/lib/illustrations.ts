import { supabase } from '@/integrations/supabase/client';
import { IllustrationRef, NewsStory } from './types';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or', 'nor',
  'not', 'so', 'very', 'just', 'about', 'up', 'its', 'it', 'this', 'that',
  'they', 'them', 'their', 'we', 'our', 'you', 'your', 'he', 'she', 'him',
  'her', 'his', 'my', 'me', 'i', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same',
  'than', 'too', 'also', 'get', 'got', 'gets', 'big', 'new', 'today',
]);

export function extractKeywords(stories: NewsStory[]): string[] {
  const text = stories
    .map(s => `${s.headline} ${s.body}`)
    .join(' ')
    .toLowerCase();

  const words = text.match(/[a-z]+/g) || [];
  const unique = new Set(
    words.filter(w => w.length > 2 && !STOP_WORDS.has(w))
  );
  return Array.from(unique);
}

function scoreIllustration(
  tags: string[],
  keywords: string[],
  lastUsed: string | null
): number {
  let score = 0;

  // Tag matching
  for (const tag of tags) {
    if (keywords.includes(tag.toLowerCase())) {
      score += 2;
    }
  }

  // Recency penalty
  if (lastUsed) {
    const daysAgo = (Date.now() - new Date(lastUsed).getTime()) / (1000 * 60 * 60 * 24);
    if (daysAgo < 2) score -= 3;
    else if (daysAgo < 7) score -= 1;
  }

  return score;
}

export async function selectIllustration(
  type: 'coloring' | 'cartoon',
  keywords: string[]
): Promise<IllustrationRef | null> {
  const { data: illustrations, error } = await supabase
    .from('illustrations')
    .select('*')
    .eq('type', type)
    .order('last_used', { ascending: true, nullsFirst: true });

  if (error || !illustrations || illustrations.length === 0) {
    console.error('Failed to fetch illustrations:', error);
    return null;
  }

  // Score each illustration
  const scored = illustrations.map(ill => ({
    ...ill,
    score: scoreIllustration(ill.tags || [], keywords, ill.last_used),
  }));

  // Sort by score desc, then by last_used asc (oldest first)
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Null last_used comes first (never used)
    if (!a.last_used && b.last_used) return -1;
    if (a.last_used && !b.last_used) return 1;
    if (!a.last_used && !b.last_used) return 0;
    return new Date(a.last_used!).getTime() - new Date(b.last_used!).getTime();
  });

  const selected = scored[0];

  // Update last_used
  await supabase
    .from('illustrations')
    .update({ last_used: new Date().toISOString() })
    .eq('id', selected.id);

  // Build public URL
  const { data: urlData } = supabase.storage
    .from('illustrations')
    .getPublicUrl(selected.storage_path);

  return {
    id: selected.id,
    url: urlData.publicUrl,
    tags: selected.tags || [],
    caption: selected.caption || undefined,
  };
}
