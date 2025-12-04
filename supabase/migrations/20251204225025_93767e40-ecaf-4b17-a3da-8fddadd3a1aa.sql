-- Enable RLS on all tables
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surgeries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all tables (temporary - until auth is implemented)
CREATE POLICY "Allow all access to patients" ON public.patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to episodes" ON public.episodes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to surgeries" ON public.surgeries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to consultations" ON public.consultations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to attachments" ON public.attachments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to kanban_boards" ON public.kanban_boards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to kanban_cards" ON public.kanban_cards FOR ALL USING (true) WITH CHECK (true);