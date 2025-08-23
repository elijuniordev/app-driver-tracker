-- Add new fields to corridas_individuais table for enhanced ride tracking
ALTER TABLE public.corridas_individuais 
ADD COLUMN IF NOT EXISTS numero_viagens INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS km_rodados NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS consumo_km_l NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS preco_combustivel NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS tempo_trabalhado INTEGER NOT NULL DEFAULT 0, -- in minutes
ADD COLUMN IF NOT EXISTS data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Update the horario column to be nullable since we're now using data_hora
ALTER TABLE public.corridas_individuais 
ALTER COLUMN horario DROP NOT NULL;

-- Create simple index for better performance
CREATE INDEX IF NOT EXISTS idx_corridas_individuais_data_hora ON public.corridas_individuais(data_hora);
CREATE INDEX IF NOT EXISTS idx_corridas_individuais_user_id ON public.corridas_individuais(user_id);