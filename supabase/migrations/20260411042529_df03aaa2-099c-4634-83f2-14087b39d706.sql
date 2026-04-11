
CREATE TABLE public.daily_editions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  edition_date date NOT NULL UNIQUE,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_editions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read editions"
  ON public.daily_editions
  FOR SELECT
  USING (true);
