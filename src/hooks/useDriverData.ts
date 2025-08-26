import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

export interface CarConfig {
  modelo: string;
  aluguelSemanal: number;
  limiteKmSemanal: number;
  valorKmExcedido: number;
  consumoKmL: number;
  precoCombustivel: number;
}

export interface DailyRecord {
  id: number;
  date: string;
  tempoTrabalhado: number; // em minutos
  numeroCorridasUber: number;
  kmRodadosUber: number;
  numeroCorridas99: number;
  kmRodados99: number;
  ganhosUber: number;
  ganhos99: number;
  gastos: Expense[];
}

export interface Expense {
  id: number;
  valor: number;
  categoria: string;
  entrada_diaria_id?: number;
}

const defaultCarConfig: CarConfig = {
  modelo: '',
  aluguelSemanal: 0,
  limiteKmSemanal: 0,
  valorKmExcedido: 0,
  consumoKmL: 10,
  precoCombustivel: 5.50,
};

export const useDriverData = () => {
  const [carConfig, setCarConfig] = useState<CarConfig>(defaultCarConfig);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCarConfig = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.log('User not authenticated');
        return;
      }

      const { data: configs, error: configError } = await supabase
        .from('car_configs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (configError) {
        console.error('Error fetching car config:', configError);
        return;
      }

      if (configs && configs.length > 0) {
        const config = configs[0];
        setCarConfig({
          modelo: config.modelo,
          aluguelSemanal: config.aluguel_semanal,
          limiteKmSemanal: config.limite_km_semanal,
          valorKmExcedido: config.valor_km_excedido,
          consumoKmL: config.consumo_km_l,
          precoCombustivel: config.preco_combustivel
        });
      }
    } catch (error) {
      console.error('Error fetching car config:', error);
    }
  }, []);

  const fetchDailyRecords = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.log('User not authenticated');
        return;
      }

      const { data: entradas, error: entradasError } = await supabase
        .from('entradas_diarias')
        .select('*')
        .eq('user_id', user.id)
        .order('data', { ascending: false });

      if (entradasError) {
        console.error('Error fetching daily entries:', entradasError);
        return;
      }

      const { data: gastos, error: gastosError } = await supabase
        .from('gastos_avulsos')
        .select('*')
        .eq('user_id', user.id);

      if (gastosError) {
        console.error('Error fetching expenses:', gastosError);
        return;
      }

      const records: DailyRecord[] = entradas?.map(entrada => ({
        id: entrada.id,
        date: entrada.data,
        tempoTrabalhado: entrada.tempo_trabalhado,
        numeroCorridasUber: entrada.numero_corridas_uber,
        kmRodadosUber: entrada.km_rodados_uber,
        numeroCorridas99: entrada.numero_corridas_99,
        kmRodados99: entrada.km_rodados_99,
        ganhosUber: entrada.ganhos_uber,
        ganhos99: entrada.ganhos_99,
        gastos: gastos?.filter(gasto => gasto.entrada_diaria_id === entrada.id).map(gasto => ({
          id: gasto.id,
          valor: gasto.valor,
          categoria: gasto.categoria,
          entrada_diaria_id: gasto.entrada_diaria_id
        })) || []
      })) || [];

      setDailyRecords(records);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCarConfig();
    fetchDailyRecords();
  }, [fetchCarConfig, fetchDailyRecords]);

  const saveCarConfig = async (config: CarConfig) => {
    try {
      setLoading(true);
      
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
            preco_combustivel: config.precoCombustivel
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

      setCarConfig(config);
      
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
    } finally {
      setLoading(false);
    }
  };

  const addDailyRecord = async (record: Omit<DailyRecord, 'id'>) => {
    try {
      setLoading(true);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Usuário não autenticado"
        });
        return;
      }

      const { data: entrada, error: entradaError } = await supabase
        .from('entradas_diarias')
        .insert({
          data: record.date,
          ganhos_uber: record.ganhosUber,
          ganhos_99: record.ganhos99,
          numero_corridas_uber: record.numeroCorridasUber,
          km_rodados_uber: record.kmRodadosUber,
          numero_corridas_99: record.numeroCorridas99,
          km_rodados_99: record.kmRodados99,
          km_rodados: record.kmRodadosUber + record.kmRodados99,
          tempo_trabalhado: record.tempoTrabalhado,
          user_id: user.id
        })
        .select()
        .single();

      if (entradaError) {
        console.error('Error inserting daily entry:', entradaError);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao salvar registro diário"
        });
        return;
      }

      if (record.gastos.length > 0) {
        const gastosToInsert = record.gastos.map(gasto => ({
          data: record.date,
          valor: gasto.valor,
          categoria: gasto.categoria,
          entrada_diaria_id: entrada.id,
          user_id: user.id
        }));

        const { error: gastosError } = await supabase
          .from('gastos_avulsos')
          .insert(gastosToInsert);

        if (gastosError) {
          console.error('Error inserting expenses:', gastosError);
        }
      }

      await fetchDailyRecords();
      
      toast({
        title: "Sucesso",
        description: "Registro salvo com sucesso!"
      });
    } catch (error) {
      console.error('Error adding daily record:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao salvar registro"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDailyRecord = async (id: number, record: Partial<DailyRecord>) => {
    try {
      setLoading(true);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Usuário não autenticado"
        });
        return;
      }

      type DailyEntryUpdate = Database['public']['Tables']['entradas_diarias']['Update'];

      const updateData: DailyEntryUpdate = {};
      if (record.ganhosUber !== undefined) updateData.ganhos_uber = record.ganhosUber;
      if (record.ganhos99 !== undefined) updateData.ganhos_99 = record.ganhos99;
      if (record.numeroCorridasUber !== undefined) updateData.numero_corridas_uber = record.numeroCorridasUber;
      if (record.kmRodadosUber !== undefined) updateData.km_rodados_uber = record.kmRodadosUber;
      if (record.numeroCorridas99 !== undefined) updateData.numero_corridas_99 = record.numeroCorridas99;
      if (record.kmRodados99 !== undefined) updateData.km_rodados_99 = record.kmRodados99;
      if (record.tempoTrabalhado !== undefined) updateData.tempo_trabalhado = record.tempoTrabalhado;
      
      if (record.kmRodadosUber !== undefined || record.kmRodados99 !== undefined) {
        const currentRecord = dailyRecords.find(r => r.id === id);
        if (currentRecord) {
          const newKmUber = record.kmRodadosUber !== undefined ? record.kmRodadosUber : currentRecord.kmRodadosUber;
          const newKm99 = record.kmRodados99 !== undefined ? record.kmRodados99 : currentRecord.kmRodados99;
          updateData.km_rodados = newKmUber + newKm99;
        }
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('entradas_diarias')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating daily entry:', error);
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Erro ao atualizar registro"
          });
          return;
        }
      }

      await fetchDailyRecords();
      
      toast({
        title: "Sucesso",
        description: "Registro atualizado com sucesso!"
      });
    } catch (error) {
      console.error('Error updating daily record:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar registro"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteDailyRecord = async (id: number) => {
    try {
      setLoading(true);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Usuário não autenticado"
        });
        return;
      }

      const { error } = await supabase
        .from('entradas_diarias')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting daily entry:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao excluir registro"
        });
        return;
      }

      await fetchDailyRecords();
      
      toast({
        title: "Sucesso",
        description: "Registro excluído com sucesso!"
      });
    } catch (error) {
      console.error('Error deleting daily record:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao excluir registro"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDailyAnalysis = useCallback((date: string) => {
    const record = dailyRecords.find(r => r.date === date);
    if (!record) return null;

    const totalGastos = record.gastos.reduce((sum, gasto) => sum + gasto.valor, 0);
    const ganhosBrutos = record.ganhosUber + record.ganhos99;
    const lucroLiquido = ganhosBrutos - totalGastos;
    const ganhoPorHora = record.tempoTrabalhado > 0 ? lucroLiquido / (record.tempoTrabalhado / 60) : 0;
    const ganhoPorMinuto = record.tempoTrabalhado > 0 ? lucroLiquido / record.tempoTrabalhado : 0;
    const totalCorridas = record.numeroCorridasUber + record.numeroCorridas99;
    const totalKm = record.kmRodadosUber + record.kmRodados99;

    return {
      date: record.date,
      ganhosBrutos,
      ganhosUber: record.ganhosUber,
      ganhos99: record.ganhos99,
      gastosTotal: totalGastos,
      lucroLiquido,
      ganhoPorHora,
      ganhoPorMinuto,
      tempoTrabalhado: record.tempoTrabalhado,
      numCorridas: totalCorridas,
      kmRodados: totalKm,
      numeroCorridasUber: record.numeroCorridasUber,
      kmRodadosUber: record.kmRodadosUber,
      numeroCorridas99: record.numeroCorridas99,
      kmRodados99: record.kmRodados99,
    };
  }, [dailyRecords]);

  const getWeeklyAnalysis = useCallback((startDate: string) => {
    const start = new Date(startDate);
    const dayOfWeek = start.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    start.setDate(start.getDate() + mondayOffset);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const weekRecords = dailyRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= start && recordDate <= end;
    });

    const ganhosUber = weekRecords.reduce((sum, record) => sum + record.ganhosUber, 0);
    const ganhos99 = weekRecords.reduce((sum, record) => sum + record.ganhos99, 0);
    const ganhosBrutos = ganhosUber + ganhos99;
    
    const gastosRegistrados = weekRecords.reduce((sum, record) => 
      sum + record.gastos.reduce((gastoSum, gasto) => gastoSum + gasto.valor, 0), 0
    );
    
    const kmTotais = weekRecords.reduce((sum, record) => sum + record.kmRodadosUber + record.kmRodados99, 0);
    const kmExcedidos = Math.max(0, kmTotais - carConfig.limiteKmSemanal);
    const custoKmExcedido = kmExcedidos * carConfig.valorKmExcedido;
    
    const gastosTotal = gastosRegistrados + carConfig.aluguelSemanal + custoKmExcedido;
    const lucroLiquido = ganhosBrutos - gastosTotal;

    const tempoTotalTrabalhado = weekRecords.reduce((sum, record) => sum + record.tempoTrabalhado, 0);
    const ganhoPorHoraUber = tempoTotalTrabalhado > 0 ? (ganhosUber / (tempoTotalTrabalhado / 60)) : 0;
    const ganhoPorHora99 = tempoTotalTrabalhado > 0 ? (ganhos99 / (tempoTotalTrabalhado / 60)) : 0;

    return {
      ganhosBrutos,
      ganhosUber,
      ganhos99,
      gastosRegistrados,
      aluguelSemanal: carConfig.aluguelSemanal,
      custoKmExcedido,
      gastosTotal,
      lucroLiquido,
      kmTotais,
      kmExcedidos,
      limiteKm: carConfig.limiteKmSemanal,
      ganhoPorHoraUber,
      ganhoPorHora99,
      tempoTotalTrabalhado,
      periodoSemana: {
        inicio: start.toISOString().split('T')[0],
        fim: end.toISOString().split('T')[0],
      },
    };
  }, [dailyRecords, carConfig]);

  return {
    carConfig,
    dailyRecords,
    loading,
    saveCarConfig,
    addDailyRecord,
    updateDailyRecord,
    deleteDailyRecord,
    getDailyAnalysis,
    getWeeklyAnalysis,
    fetchDailyRecords,
    fetchCarConfig,
  };
};