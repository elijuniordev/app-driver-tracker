-- Fix function search path security warning by recreating trigger and function
DROP TRIGGER IF EXISTS update_entradas_diarias_updated_at ON public.entradas_diarias;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Create function with proper security settings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_entradas_diarias_updated_at
  BEFORE UPDATE ON public.entradas_diarias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();