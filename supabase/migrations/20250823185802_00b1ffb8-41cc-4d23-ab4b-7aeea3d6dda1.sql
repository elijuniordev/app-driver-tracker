-- Make entrada_diaria_id nullable since we're moving away from daily entry dependencies
ALTER TABLE public.corridas_individuais 
ALTER COLUMN entrada_diaria_id DROP NOT NULL;