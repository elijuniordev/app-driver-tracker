-- Create table for daily entries
CREATE TABLE public.entradas_diarias (
  id SERIAL PRIMARY KEY,
  data DATE NOT NULL,
  ganhos_uber NUMERIC(10,2) NOT NULL DEFAULT 0,
  ganhos_99 NUMERIC(10,2) NOT NULL DEFAULT 0,
  km_rodados NUMERIC(8,2) NOT NULL DEFAULT 0,
  tempo_trabalhado INTEGER NOT NULL DEFAULT 0, -- em minutos
  consumo_km_l NUMERIC(5,2) NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for miscellaneous expenses
CREATE TABLE public.gastos_avulsos (
  id SERIAL PRIMARY KEY,
  data DATE NOT NULL,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL,
  entrada_diaria_id INTEGER REFERENCES public.entradas_diarias(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.entradas_diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos_avulsos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for entradas_diarias
CREATE POLICY "Users can view their own daily entries" 
ON public.entradas_diarias 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily entries" 
ON public.entradas_diarias 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily entries" 
ON public.entradas_diarias 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily entries" 
ON public.entradas_diarias 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for gastos_avulsos
CREATE POLICY "Users can view their own expenses" 
ON public.gastos_avulsos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses" 
ON public.gastos_avulsos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" 
ON public.gastos_avulsos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" 
ON public.gastos_avulsos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_entradas_diarias_user_data ON public.entradas_diarias(user_id, data);
CREATE INDEX idx_gastos_avulsos_user_data ON public.gastos_avulsos(user_id, data);
CREATE INDEX idx_gastos_avulsos_entrada ON public.gastos_avulsos(entrada_diaria_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_entradas_diarias_updated_at
  BEFORE UPDATE ON public.entradas_diarias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();