-- Create car configuration table
CREATE TABLE public.car_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  modelo TEXT NOT NULL,
  aluguel_semanal NUMERIC NOT NULL DEFAULT 0,
  limite_km_semanal NUMERIC NOT NULL DEFAULT 0,
  valor_km_excedido NUMERIC NOT NULL DEFAULT 0,
  consumo_km_l NUMERIC NOT NULL DEFAULT 10,
  preco_combustivel NUMERIC NOT NULL DEFAULT 5.50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.car_configs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own car config" 
ON public.car_configs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own car config" 
ON public.car_configs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own car config" 
ON public.car_configs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own car config" 
ON public.car_configs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for timestamps
CREATE TRIGGER update_car_configs_updated_at
BEFORE UPDATE ON public.car_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update entradas_diarias table to have separate fields for Uber and 99
ALTER TABLE public.entradas_diarias 
ADD COLUMN numero_corridas_uber INTEGER NOT NULL DEFAULT 0,
ADD COLUMN km_rodados_uber NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN numero_corridas_99 INTEGER NOT NULL DEFAULT 0,
ADD COLUMN km_rodados_99 NUMERIC NOT NULL DEFAULT 0;

-- Remove the old consumo_km_l column from entradas_diarias as it will come from car_configs
ALTER TABLE public.entradas_diarias 
DROP COLUMN consumo_km_l;