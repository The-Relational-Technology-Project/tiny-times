CREATE TABLE public.print_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_date date,
  printed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.print_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert print events"
  ON public.print_events
  FOR INSERT
  TO public
  WITH CHECK (true);