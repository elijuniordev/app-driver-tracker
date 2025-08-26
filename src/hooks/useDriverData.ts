import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { createLocalDate } from '@/lib/utils';

// Interfaces (tipos) Finais
export interface CarConfig {
  id?: string;
  modelo: string;
  aluguelSemanal: number;
  limiteKmSemanal: number;
  valorKmExcedido: number;
  dataInicioContrato: string;
  duracaoContratoDias: number;
  metaGanhosSemanal: number;
  is_active?: boolean;
}

export interface DailyRecord {
  id: number;
  date: string;
  tempoTrabalhado: number;
  numeroCorridasUber: number;
  kmRodadosUber: number;
  numeroCorridas99: number;
  kmRodados99: number;
  ganhosUber: number;
  ganhos99: number;
  precoCombustivel: number;
  consumoKmL: number;
  gastos: Expense[];
  ganhosExtras: ExtraEarning[];
}

export interface Expense {
  id: number;
  valor: number;
  categoria: string;
  entrada_diaria_id?: number;
}

export interface ExtraEarning {
  id: number;
  data: string;
  valor: number;
  categoria: string;
  descricao?: string;
  entrada_diaria_id?: number;
}

const defaultCarConfig: CarConfig = {
  modelo: '',
  aluguelSemanal: 0,
  limiteKmSemanal: 0,
  valorKmExcedido: 0,
  dataInicioContrato: new Date().toISOString().split('T')[0],
  duracaoContratoDias: 60,
  metaGanhosSemanal: 0,
  is_active: true,
};

export const useDriverData = () => {
  const [carConfig, setCarConfig] = useState<CarConfig>(defaultCarConfig);
  const [allCarConfigs, setAllCarConfigs] = useState<CarConfig[]>([]);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAllCarConfigs = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.from('car_configs').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      
      const typedData: CarConfig[] = data.map(config => ({
        id: config.id,
        modelo: config.modelo,
        aluguelSemanal: config.aluguel_semanal,
        limiteKmSemanal: config.limite_km_semanal,
        valorKmExcedido: config.valor_km_excedido,
        dataInicioContrato: config.data_inicio_contrato,
        duracaoContratoDias: config.duracao_contrato_dias,
        metaGanhosSemanal: config.meta_ganhos_semanal || 0,
        is_active: config.is_active,
      }));
      
      setAllCarConfigs(typedData);
      const activeCar = typedData.find(c => c.is_active);
      setCarConfig(activeCar || typedData[0] || defaultCarConfig);
    } catch (error) {
      console.error('Error fetching car configs:', error);
    }
  }, []);

  const fetchDailyRecords = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: entradas, error: entradasError } = await supabase.from('entradas_diarias').select('*').eq('user_id', user.id).order('data', { ascending: false });
      if (entradasError) throw entradasError;

      const { data: gastos, error: gastosError } = await supabase.from('gastos_avulsos').select('*').eq('user_id', user.id);
      if (gastosError) throw gastosError;
      
      const { data: ganhosExtras, error: ganhosError } = await supabase.from('ganhos_avulsos').select('*').eq('user_id', user.id);
      if (ganhosError) throw ganhosError;

      const records: DailyRecord[] = entradas.map(e => ({
        id: e.id,
        date: e.data,
        tempoTrabalhado: e.tempo_trabalhado,
        numeroCorridasUber: e.numero_corridas_uber,
        kmRodadosUber: e.km_rodados_uber,
        numeroCorridas99: e.numero_corridas_99,
        kmRodados99: e.km_rodados_99,
        ganhosUber: e.ganhos_uber,
        ganhos99: e.ganhos_99,
        precoCombustivel: e.preco_combustivel || 0,
        consumoKmL: e.consumo_km_l || 0,
        gastos: gastos?.filter(g => g.entrada_diaria_id === e.id).map(g => ({ ...g, entrada_diaria_id: g.entrada_diaria_id ?? undefined })) || [],
        ganhosExtras: ganhosExtras?.filter(g => g.entrada_diaria_id === e.id).map(g => ({ ...g, descricao: g.descricao || '', entrada_diaria_id: g.entrada_diaria_id ?? undefined })) || [],
      }));
      setDailyRecords(records);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, []);
  
  useEffect(() => {
    const initializeData = async () => {
        setLoading(true);
        await fetchAllCarConfigs();
        await fetchDailyRecords();
        setLoading(false);
    };
    initializeData();
  }, [fetchAllCarConfigs, fetchDailyRecords]);

  const saveCarConfig = async (config: CarConfig) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const dataToUpsert = {
        id: config.id,
        user_id: user.id,
        modelo: config.modelo,
        aluguel_semanal: config.aluguelSemanal,
        limite_km_semanal: config.limiteKmSemanal,
        valor_km_excedido: config.valorKmExcedido,
        data_inicio_contrato: config.dataInicioContrato,
        duracao_contrato_dias: config.duracaoContratoDias,
        meta_ganhos_semanal: config.metaGanhosSemanal,
        is_active: config.is_active,
      };

      const { error } = await supabase.from('car_configs').upsert(dataToUpsert, { onConflict: 'id' });
      if (error) throw error;
      
      await fetchAllCarConfigs();
      toast({ title: "Sucesso", description: `Veículo ${config.id ? 'atualizado' : 'adicionado'} com sucesso!` });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar configuração";
      toast({ variant: "destructive", title: "Erro", description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const setActiveCarConfig = async (carId: string) => {
    try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        const { error } = await supabase.rpc('set_active_car', { user_id_param: user.id, car_id_param: carId });
        if (error) throw error;

        await fetchAllCarConfigs();
        toast({ title: "Sucesso!", description: "Veículo ativo foi atualizado." });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro ao ativar veículo";
        toast({ variant: "destructive", title: "Erro", description: errorMessage });
    } finally {
        setLoading(false);
    }
  };
  
  const deactivateCarConfig = async (carId: string) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from('car_configs').update({ is_active: false }).eq('id', carId).eq('user_id', user.id);
      if (error) throw error;

      await fetchAllCarConfigs();
      toast({ title: "Sucesso!", description: "Veículo foi desativado." });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro ao desativar veículo";
        toast({ variant: "destructive", title: "Erro", description: errorMessage });
    } finally {
        setLoading(false);
    }
  };

  const upsertEarnings = async (record: Omit<DailyRecord, 'id' | 'gastos' | 'ganhosExtras'>) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: existingRecord, error: fetchError } = await supabase.from('entradas_diarias').select('*').eq('user_id', user.id).eq('data', record.date).single();
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      
      if (existingRecord) {
        const { error: updateError } = await supabase.from('entradas_diarias').update({
            ganhos_uber: existingRecord.ganhos_uber + record.ganhosUber,
            ganhos_99: existingRecord.ganhos_99 + record.ganhos99,
            numero_corridas_uber: existingRecord.numero_corridas_uber + record.numeroCorridasUber,
            km_rodados_uber: existingRecord.km_rodados_uber + record.kmRodadosUber,
            numero_corridas_99: existingRecord.numero_corridas_99 + record.numeroCorridas99,
            km_rodados_99: existingRecord.km_rodados_99 + record.kmRodados99,
            tempo_trabalhado: existingRecord.tempo_trabalhado + record.tempoTrabalhado,
            preco_combustivel: record.precoCombustivel || existingRecord.preco_combustivel,
            consumo_km_l: record.consumoKmL || existingRecord.consumo_km_l,
            km_rodados: existingRecord.km_rodados + record.kmRodadosUber + record.kmRodados99,
          }).eq('id', existingRecord.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('entradas_diarias').insert({
            data: record.date,
            ganhos_uber: record.ganhosUber,
            ganhos_99: record.ganhos99,
            numero_corridas_uber: record.numeroCorridasUber,
            km_rodados_uber: record.kmRodadosUber,
            numero_corridas_99: record.numeroCorridas99,
            km_rodados_99: record.kmRodados99,
            km_rodados: record.kmRodadosUber + record.kmRodados99,
            tempo_trabalhado: record.tempoTrabalhado,
            preco_combustivel: record.precoCombustivel,
            consumo_km_l: record.consumoKmL,
            user_id: user.id
        });
        if (insertError) throw insertError;
      }
      await fetchDailyRecords();
      toast({ title: "Sucesso", description: "Ganhos registrados com sucesso!" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar ganhos";
      toast({ variant: "destructive", title: "Erro", description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expense: { data: string; valor: number; categoria: string }) => {
    try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        let { data: dailyEntry } = await supabase.from('entradas_diarias').select('id').eq('user_id', user.id).eq('data', expense.data).single();
        if (!dailyEntry) {
            const { data: newEntry, error: insertError } = await supabase.from('entradas_diarias').insert({ data: expense.data, user_id: user.id }).select('id').single();
            if (insertError) throw insertError;
            dailyEntry = newEntry;
        }

        const { error: expenseError } = await supabase.from('gastos_avulsos').insert({ ...expense, entrada_diaria_id: dailyEntry!.id, user_id: user.id });
        if (expenseError) throw expenseError;

        await fetchDailyRecords();
        toast({ title: "Sucesso", description: "Despesa adicionada com sucesso!" });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro ao salvar despesa";
        toast({ variant: "destructive", title: "Erro", description: errorMessage });
    } finally {
        setLoading(false);
    }
  };

  const addExtraEarning = async (earning: Omit<ExtraEarning, 'id' | 'entrada_diaria_id'>) => {
    try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");
        let { data: dailyEntry } = await supabase.from('entradas_diarias').select('id').eq('user_id', user.id).eq('data', earning.data).single();
        if (!dailyEntry) {
            const { data: newEntry, error: insertError } = await supabase.from('entradas_diarias').insert({ data: earning.data, user_id: user.id }).select('id').single();
            if (insertError) throw insertError;
            dailyEntry = newEntry;
        }
        const { error: earningError } = await supabase.from('ganhos_avulsos').insert({ ...earning, entrada_diaria_id: dailyEntry!.id, user_id: user.id });
        if (earningError) throw earningError;
        await fetchDailyRecords();
        toast({ title: "Sucesso", description: "Ganho extra adicionado!" });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro ao salvar ganho extra";
        toast({ variant: "destructive", title: "Erro", description: errorMessage });
    } finally {
        setLoading(false);
    }
  };
  
  const updateDailyRecord = async (updatedRecord: DailyRecord) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error: updateEntryError } = await supabase.from('entradas_diarias').update({
          ganhos_uber: updatedRecord.ganhosUber,
          ganhos_99: updatedRecord.ganhos99,
          numero_corridas_uber: updatedRecord.numeroCorridasUber,
          km_rodados_uber: updatedRecord.kmRodadosUber,
          numero_corridas_99: updatedRecord.numeroCorridas99,
          km_rodados_99: updatedRecord.kmRodados99,
          tempo_trabalhado: updatedRecord.tempoTrabalhado,
          preco_combustivel: updatedRecord.precoCombustivel,
          consumo_km_l: updatedRecord.consumoKmL,
          km_rodados: updatedRecord.kmRodadosUber + updatedRecord.kmRodados99,
        }).eq('id', updatedRecord.id);
      if (updateEntryError) throw updateEntryError;

      await supabase.from('gastos_avulsos').delete().eq('entrada_diaria_id', updatedRecord.id);
      if (updatedRecord.gastos.length > 0) {
        const expensesToInsert = updatedRecord.gastos.map(gasto => ({ entrada_diaria_id: updatedRecord.id, user_id: user.id, data: updatedRecord.date, categoria: gasto.categoria, valor: gasto.valor }));
        await supabase.from('gastos_avulsos').insert(expensesToInsert);
      }
      
      await supabase.from('ganhos_avulsos').delete().eq('entrada_diaria_id', updatedRecord.id);
      if (updatedRecord.ganhosExtras.length > 0) {
          const earningsToInsert = updatedRecord.ganhosExtras.map(earning => ({ entrada_diaria_id: updatedRecord.id, user_id: user.id, data: updatedRecord.date, categoria: earning.categoria, valor: earning.valor, descricao: earning.descricao }));
          await supabase.from('ganhos_avulsos').insert(earningsToInsert);
      }

      await fetchDailyRecords();
      toast({ title: "Sucesso", description: "Registro atualizado com sucesso!" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar registro";
      toast({ variant: "destructive", title: "Erro", description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const deleteDailyRecord = async (id: number) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from('entradas_diarias').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;

      await fetchDailyRecords();
      toast({ title: "Sucesso", description: "Registro excluído com sucesso!" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao excluir registro";
      toast({ variant: "destructive", title: "Erro", description: errorMessage });
    } finally {
      setLoading(false);
    }
  };
  
  return {
    carConfig,
    allCarConfigs,
    dailyRecords,
    loading,
    saveCarConfig,
    setActiveCarConfig,
    deactivateCarConfig,
    upsertEarnings,
    addExpense,
    addExtraEarning,
    updateDailyRecord,
    deleteDailyRecord,
    fetchDailyRecords,
    fetchAllCarConfigs,
  };
};