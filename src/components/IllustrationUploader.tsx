import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';

interface IllustrationUploaderProps {
  type: 'coloring' | 'cartoon';
  onUploaded: () => void;
}

export function IllustrationUploader({ type, onUploaded }: IllustrationUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFiles = useCallback(async (files: FileList) => {
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!['png', 'jpg', 'jpeg', 'svg'].includes(ext || '')) continue;

        const filename = `${type}-${Date.now()}-${file.name}`;
        const storagePath = `${type}/${filename}`;

        const { error: uploadError } = await supabase.storage
          .from('illustrations')
          .upload(storagePath, file);

        if (uploadError) {
          console.error('Upload failed:', uploadError);
          continue;
        }

        const { error: insertError } = await supabase
          .from('illustrations')
          .insert({
            type,
            filename: file.name,
            storage_path: storagePath,
            tags: [],
          });

        if (insertError) console.error('Insert failed:', insertError);
      }
      onUploaded();
    } finally {
      setIsUploading(false);
    }
  }, [type, onUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFiles(e.target.files);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      {isUploading ? (
        <div className="flex items-center justify-center gap-2 text-muted-foreground font-body">
          <Loader2 className="h-5 w-5 animate-spin" />
          Uploading…
        </div>
      ) : (
        <>
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground font-body mb-2">
            Drag & drop {type === 'coloring' ? 'coloring pages' : 'cartoon panels'} here
          </p>
          <label>
            <Button variant="outline" size="sm" className="font-body" asChild>
              <span>Choose Files</span>
            </Button>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.svg"
              multiple
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
          <p className="text-xs text-muted-foreground mt-2">PNG, JPG, or SVG</p>
        </>
      )}
    </div>
  );
}
