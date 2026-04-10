
-- Create illustrations table
CREATE TABLE public.illustrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('coloring', 'cartoon')),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  caption TEXT,
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.illustrations ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view illustrations"
  ON public.illustrations FOR SELECT
  USING (true);

-- Open write for now (no auth system yet)
CREATE POLICY "Anyone can insert illustrations"
  ON public.illustrations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update illustrations"
  ON public.illustrations FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete illustrations"
  ON public.illustrations FOR DELETE
  USING (true);

-- Create index on type for faster queries
CREATE INDEX idx_illustrations_type ON public.illustrations (type);

-- Create index on tags for GIN search
CREATE INDEX idx_illustrations_tags ON public.illustrations USING GIN (tags);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('illustrations', 'illustrations', true);

-- Storage policies
CREATE POLICY "Anyone can view illustration files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'illustrations');

CREATE POLICY "Anyone can upload illustration files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'illustrations');

CREATE POLICY "Anyone can update illustration files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'illustrations');

CREATE POLICY "Anyone can delete illustration files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'illustrations');
