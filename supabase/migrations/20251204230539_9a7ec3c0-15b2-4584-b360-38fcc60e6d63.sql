
-- Add hospitals table
CREATE TABLE public.hospitals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to hospitals" ON public.hospitals FOR ALL USING (true) WITH CHECK (true);

-- Update episodes table with new fields
ALTER TABLE public.episodes 
  ADD COLUMN hospital_id uuid REFERENCES public.hospitals(id),
  ADD COLUMN episode_type text NOT NULL DEFAULT 'hospitalization',
  ADD COLUMN start_date_new timestamp with time zone DEFAULT now(),
  ADD COLUMN end_date_new timestamp with time zone;

-- Update surgeries table with new fields
ALTER TABLE public.surgeries
  ADD COLUMN main_surgeon text,
  ADD COLUMN assistants text[],
  ADD COLUMN structured_description text,
  ADD COLUMN extra_fields jsonb DEFAULT '{}',
  ADD COLUMN drawings text[];

-- Update consultations table with new fields
ALTER TABLE public.consultations
  ADD COLUMN consultation_type text NOT NULL DEFAULT 'pre_op',
  ADD COLUMN location text,
  ADD COLUMN surgery_id uuid REFERENCES public.surgeries(id);

-- Update attachments table
ALTER TABLE public.attachments
  ADD COLUMN surgery_id uuid REFERENCES public.surgeries(id),
  ADD COLUMN attachment_type text NOT NULL DEFAULT 'document',
  ADD COLUMN mime_type text;

-- Create comments table
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  episode_id uuid REFERENCES public.episodes(id) ON DELETE CASCADE,
  surgery_id uuid REFERENCES public.surgeries(id) ON DELETE CASCADE,
  text text NOT NULL,
  author text,
  mentions text[],
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to comments" ON public.comments FOR ALL USING (true) WITH CHECK (true);

-- Update kanban_boards with hospital and configurable columns
ALTER TABLE public.kanban_boards
  ADD COLUMN hospital_id uuid REFERENCES public.hospitals(id),
  ADD COLUMN service text,
  ADD COLUMN columns_config jsonb NOT NULL DEFAULT '[{"id": "waiting", "name": "Waiting List", "color": "gray"}, {"id": "scheduled", "name": "Scheduled", "color": "yellow"}, {"id": "operated", "name": "Operated", "color": "green"}, {"id": "follow_up", "name": "Follow-up", "color": "blue"}]';

-- Update kanban_cards
ALTER TABLE public.kanban_cards
  ADD COLUMN priority text DEFAULT 'normal',
  ADD COLUMN scheduled_date timestamp with time zone,
  ADD COLUMN surgery_type text;

-- Add triggers for updated_at
CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON public.hospitals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
