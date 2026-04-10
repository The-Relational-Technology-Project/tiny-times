import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TagEditor } from '@/components/TagEditor';
import { IllustrationUploader } from '@/components/IllustrationUploader';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Illustration {
  id: string;
  type: string;
  filename: string;
  storage_path: string;
  tags: string[];
  caption: string | null;
  last_used: string | null;
  created_at: string;
}

export default function Library() {
  const [illustrations, setIllustrations] = useState<Illustration[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchIllustrations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('illustrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setIllustrations(data as Illustration[]);
    setLoading(false);
  };

  useEffect(() => { fetchIllustrations(); }, []);

  const updateTags = async (id: string, tags: string[]) => {
    await supabase.from('illustrations').update({ tags }).eq('id', id);
    setIllustrations(prev => prev.map(i => i.id === id ? { ...i, tags } : i));
  };

  const updateCaption = async (id: string, caption: string) => {
    await supabase.from('illustrations').update({ caption }).eq('id', id);
    setIllustrations(prev => prev.map(i => i.id === id ? { ...i, caption } : i));
  };

  const deleteIllustration = async (ill: Illustration) => {
    await supabase.storage.from('illustrations').remove([ill.storage_path]);
    await supabase.from('illustrations').delete().eq('id', ill.id);
    setIllustrations(prev => prev.filter(i => i.id !== ill.id));
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('illustrations').getPublicUrl(path);
    return data.publicUrl;
  };

  const coloringPages = illustrations.filter(i => i.type === 'coloring');
  const cartoons = illustrations.filter(i => i.type === 'cartoon');

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl text-primary">Illustration Library</h1>
            <p className="text-sm text-muted-foreground font-body">
              Manage coloring pages and cartoon panels
            </p>
          </div>
        </div>

        <Tabs defaultValue="coloring">
          <TabsList className="font-body">
            <TabsTrigger value="coloring">🖍️ Coloring Pages ({coloringPages.length})</TabsTrigger>
            <TabsTrigger value="cartoon">🐻 Cartoons ({cartoons.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="coloring" className="mt-4 space-y-4">
            <IllustrationUploader type="coloring" onUploaded={fetchIllustrations} />
            {loading ? (
              <p className="text-muted-foreground font-body text-center py-8">Loading…</p>
            ) : (
              <IllustrationGrid
                items={coloringPages}
                getPublicUrl={getPublicUrl}
                onUpdateTags={updateTags}
                onDelete={deleteIllustration}
              />
            )}
          </TabsContent>

          <TabsContent value="cartoon" className="mt-4 space-y-4">
            <IllustrationUploader type="cartoon" onUploaded={fetchIllustrations} />
            {loading ? (
              <p className="text-muted-foreground font-body text-center py-8">Loading…</p>
            ) : (
              <IllustrationGrid
                items={cartoons}
                getPublicUrl={getPublicUrl}
                onUpdateTags={updateTags}
                onUpdateCaption={updateCaption}
                onDelete={deleteIllustration}
                showCaption
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function IllustrationGrid({
  items,
  getPublicUrl,
  onUpdateTags,
  onUpdateCaption,
  onDelete,
  showCaption = false,
}: {
  items: Illustration[];
  getPublicUrl: (path: string) => string;
  onUpdateTags: (id: string, tags: string[]) => void;
  onUpdateCaption?: (id: string, caption: string) => void;
  onDelete: (ill: Illustration) => void;
  showCaption?: boolean;
}) {
  if (items.length === 0) {
    return (
      <p className="text-center text-muted-foreground font-body py-8">
        No illustrations yet. Upload some above!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {items.map(ill => (
        <div key={ill.id} className="border rounded-lg overflow-hidden bg-popover">
          <img
            src={getPublicUrl(ill.storage_path)}
            alt={ill.filename}
            className="w-full aspect-square object-contain bg-white"
          />
          <div className="p-3 space-y-2">
            <p className="text-xs text-muted-foreground font-body truncate">{ill.filename}</p>
            {ill.last_used && (
              <p className="text-[10px] text-muted-foreground font-body">
                Last used: {new Date(ill.last_used).toLocaleDateString()}
              </p>
            )}
            <TagEditor tags={ill.tags || []} onChange={tags => onUpdateTags(ill.id, tags)} />
            {showCaption && onUpdateCaption && (
              <Input
                value={ill.caption || ''}
                onChange={e => onUpdateCaption(ill.id, e.target.value)}
                placeholder="Caption…"
                className="text-xs font-body h-7"
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive w-full text-xs"
              onClick={() => onDelete(ill)}
            >
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
