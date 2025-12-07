-- Add hospital_id to surgeries table to link surgeries with hospitals
ALTER TABLE public.surgeries 
ADD COLUMN hospital_id uuid REFERENCES public.hospitals(id);

-- Create index for better query performance when filtering by hospital
CREATE INDEX idx_surgeries_hospital_id ON public.surgeries(hospital_id);