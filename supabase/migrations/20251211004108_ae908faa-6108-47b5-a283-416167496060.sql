-- Add manual_override column to kanban_cards to disable auto-sync when card is manually moved
ALTER TABLE public.kanban_cards 
ADD COLUMN IF NOT EXISTS manual_override boolean NOT NULL DEFAULT false;

-- Create storage bucket for patient attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-attachments', 'patient-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to patient attachments
CREATE POLICY "Public read access for attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'patient-attachments');

-- Allow authenticated insert for attachments (using anon for now since no auth)
CREATE POLICY "Allow insert for attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'patient-attachments');

-- Allow delete for attachments
CREATE POLICY "Allow delete for attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'patient-attachments');