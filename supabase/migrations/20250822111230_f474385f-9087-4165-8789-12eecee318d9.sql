-- Create table for individual rides
CREATE TABLE public.corridas_individuais (
  id SERIAL PRIMARY KEY,
  entrada_diaria_id INTEGER NOT NULL,
  plataforma TEXT NOT NULL CHECK (plataforma IN ('uber', '99')),
  valor NUMERIC NOT NULL DEFAULT 0,
  horario TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.corridas_individuais ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own rides" 
ON public.corridas_individuais 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own rides" 
ON public.corridas_individuais 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rides" 
ON public.corridas_individuais 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rides" 
ON public.corridas_individuais 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add foreign key relationship (optional, but good practice)
ALTER TABLE public.corridas_individuais 
ADD CONSTRAINT fk_corridas_entrada_diaria 
FOREIGN KEY (entrada_diaria_id) 
REFERENCES public.entradas_diarias(id) 
ON DELETE CASCADE;