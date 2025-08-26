import { createClient } from "@supabase/supabase-js";
import { CarConfig } from "../types";
import { useToast } from '../use-toast';

export const fetchCarConfig = async (supabase: ReturnType<typeof createClient>) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('User not authenticated');
      return null;
    }

    const { data: configs, error: configError } = await supabase
      .from('car_configs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (configError) {
      console.error('Error fetching car config:', configError);
      return null;
    }

    if (configs && configs.length > 0) {
      const config = configs[0];
      return {
        modelo: config.modelo,
        aluguelSemanal: config.aluguel_semanal,
        limiteKmSemanal: config.limite_km_semanal,
        valorKmExcedido: config.valor_km_excedido,
        consumoKmL: config.consumo_km_l,
        precoCombustivel: config.preco_combustivel,
        dataInicioContrato: config.data_inicio_contrato,
        duracaoContratoDias: config.duracao_contrato_dias,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching car config:", error);
    return null;
  }
};

export const saveCarConfig = async (supabase: ReturnType<typeof createClient>, config: CarConfig, toast: ReturnType<typeof useToast>['toast']) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário não autenticado"
      });
      return;
    }

    const { data: existingConfigs, error: fetchError } = await supabase
      .from('car_configs')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (fetchError) {
      console.error('Error checking existing config:', fetchError);
      return;
    }

    if (existingConfigs && existingConfigs.length > 0) {
      const { error: updateError } = await supabase
        .from('car_configs')
        .update({
          modelo: config.modelo,
          aluguel_semanal: config.aluguelSemanal,
          limite_km_semanal: config.limiteKmSemanal,
          valor_km_excedido: config.valorKmExcedido,
          consumo_km_l: config.consumoKmL,
          preco_combustivel: config.precoCombustivel,
          data_inicio_contrato: config.dataInicioContrato,
          duracao_contrato_dias: config.duracaoContratoDias,
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating car config:', updateError);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao atualizar configuração do veículo"
        });
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from('car_configs')
        .insert({
          modelo: config.modelo,
          aluguel_semanal: config.aluguelSemanal,
          limite_km_semanal: config.limiteKmSemanal,
          valor_km_excedido: config.valorKmExcedido,
          consumo_km_l: config.consumoKmL,
          preco_combustivel: config.precoCombustivel,
          data_inicio_contrato: config.dataInicioContrato,
          duracao_contrato_dias: config.duracaoContratoDias,
          user_id: user.id
        });

      if (insertError) {
        console.error('Error inserting car config:', insertError);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao salvar configuração do veículo"
        });
        return;
      }
    }

    toast({
      title: "Sucesso",
      description: "Configuração do veículo salva com sucesso!"
    });
  } catch (error) {
    console.error('Error saving car config:', error);
    toast({
      variant: "destructive",
      title: "Erro",
      description: "Erro ao salvar configuração"
    });
  }
};