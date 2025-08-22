import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CarConfig {
  modelo: string;
  aluguelSemanal: number;
  limiteKmSemanal: number;
  valorKmExcedido: number;
}

export interface DailyRecord {
  id: number;
  date: string;
  tempoTrabalhado: number; // em minutos
  numCorridas: number;
  kmRodados: number;
  ganhosUber: number;
  ganhos99: number;
  consumoKmL: number;
  gastos: Expense[];
}

export interface Expense {
  id: number;
  valor: number;
  categoria: string;
  entrada_diaria_id?: number;
}

const STORAGE_KEY = 'driver-tracker-car-config';

const defaultCarConfig: CarConfig = {
  modelo: '',
  aluguelSemanal: 0,
  limiteKmSemanal: 0,
  valorKmExcedido: 0,
};

export const useDriverData = () => {
  const [carConfig, setCarConfig] = useState<CarConfig>(defaultCarConfig);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load car config from localStorage and daily records from Supabase on mount
  useEffect(() => {
    const savedCarConfig = localStorage.getItem(STORAGE_KEY);
    if (savedCarConfig) {
      setCarConfig(JSON.parse(savedCarConfig));
    }
    
    fetchDailyRecords();
  }, []);

  const fetchDailyRecords = async () => {
    try {
      setLoading(true);
      
      // Get user session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.log('User not authenticated');
        return;
      }

      // Fetch daily entries
      const { data: entradas, error: entradasError } = await supabase
        .from('entradas_diarias')
        .select('*')
        .eq('user_id', user.id)
        .order('data', { ascending: false });

      if (entradasError) {
        console.error('Error fetching daily entries:', entradasError);
        return;
      }

      // Fetch expenses for all entries
      const { data: gastos, error: gastosError } = await supabase
        .from('gastos_avulsos')
        .select('*')
        .eq('user_id', user.id);

      if (gastosError) {
        console.error('Error fetching expenses:', gastosError);
        return;
      }

      // Transform data to match interface
      const records: DailyRecord[] = entradas?.map(entrada => ({
        id: entrada.id,
        date: entrada.data,
        tempoTrabalhado: entrada.tempo_trabalhado,
        numCorridas: 0, // Will be calculated or added later
        kmRodados: entrada.km_rodados,
        ganhosUber: entrada.ganhos_uber,
        ganhos99: entrada.ganhos_99,
        consumoKmL: entrada.consumo_km_l,
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
  };

  // Helper functions
  const saveCarConfig = (config: CarConfig) => {
    setCarConfig(config);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  };

  const addDailyRecord = async (record: Omit<DailyRecord, 'id'>) => {
    try {
      setLoading(true);
      
      // Get user session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Usuário não autenticado"
        });
        return;
      }

      // Insert daily entry
      const { data: entrada, error: entradaError } = await supabase
        .from('entradas_diarias')
        .insert({
          data: record.date,
          ganhos_uber: record.ganhosUber,
          ganhos_99: record.ganhos99,
          km_rodados: record.kmRodados,
          tempo_trabalhado: record.tempoTrabalhado,
          consumo_km_l: record.consumoKmL,
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

      // Insert expenses
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

      // Refresh data
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
      
      // Get user session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Usuário não autenticado"
        });
        return;
      }

      // Update daily entry
      const updateData: any = {};
      if (record.ganhosUber !== undefined) updateData.ganhos_uber = record.ganhosUber;
      if (record.ganhos99 !== undefined) updateData.ganhos_99 = record.ganhos99;
      if (record.kmRodados !== undefined) updateData.km_rodados = record.kmRodados;
      if (record.tempoTrabalhado !== undefined) updateData.tempo_trabalhado = record.tempoTrabalhado;
      if (record.consumoKmL !== undefined) updateData.consumo_km_l = record.consumoKmL;

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

      // Refresh data
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
      
      // Get user session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Usuário não autenticado"
        });
        return;
      }

      // Delete daily entry (expenses will be deleted automatically due to CASCADE)
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

      // Refresh data
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

  // Analysis functions
  const getDailyAnalysis = (date: string) => {
    const record = dailyRecords.find(r => r.date === date);
    if (!record) return null;

    const totalGastos = record.gastos.reduce((sum, gasto) => sum + gasto.valor, 0);
    const ganhosBrutos = record.ganhosUber + record.ganhos99;
    const lucroLiquido = ganhosBrutos - totalGastos;
    const ganhoPorHora = record.tempoTrabalhado > 0 ? lucroLiquido / (record.tempoTrabalhado / 60) : 0;
    const ganhoPorMinuto = record.tempoTrabalhado > 0 ? lucroLiquido / record.tempoTrabalhado : 0;

    return {
      ganhosBrutos,
      ganhosUber: record.ganhosUber,
      ganhos99: record.ganhos99,
      gastosTotal: totalGastos,
      lucroLiquido,
      ganhoPorHora,
      ganhoPorMinuto,
      tempoTrabalhado: record.tempoTrabalhado,
      numCorridas: record.numCorridas,
      kmRodados: record.kmRodados,
    };
  };

  const getWeeklyAnalysis = (startDate: string) => {
    // Garantir que startDate seja uma segunda-feira
    const start = new Date(startDate);
    const dayOfWeek = start.getDay(); // 0 = domingo, 1 = segunda
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    start.setDate(start.getDate() + mondayOffset);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6); // domingo

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
    
    const kmTotais = weekRecords.reduce((sum, record) => sum + record.kmRodados, 0);
    const kmExcedidos = Math.max(0, kmTotais - carConfig.limiteKmSemanal);
    const custoKmExcedido = kmExcedidos * carConfig.valorKmExcedido;
    
    const gastosTotal = gastosRegistrados + carConfig.aluguelSemanal + custoKmExcedido;
    const lucroLiquido = ganhosBrutos - gastosTotal;

    // Análise comparativa por plataforma
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
  };

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
  };
};