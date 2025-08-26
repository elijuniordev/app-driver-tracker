import { createClient } from "@supabase/supabase-js";
import { DailyRecord, Expense } from "../types";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "../use-toast";

export const fetchDailyRecords = async (supabase: ReturnType<typeof createClient>): Promise<DailyRecord[]> => {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.log('User not authenticated');
            return [];
        }

        const { data: entradas, error: entradasError } = await supabase
            .from('entradas_diarias')
            .select('*')
            .eq('user_id', user.id)
            .order('data', { ascending: false });

        if (entradasError) {
            console.error('Error fetching daily entries:', entradasError);
            return [];
        }

        const { data: gastos, error: gastosError } = await supabase
            .from('gastos_avulsos')
            .select('*')
            .eq('user_id', user.id);

        if (gastosError) {
            console.error('Error fetching expenses:', gastosError);
            return [];
        }

        const records: DailyRecord[] = entradas?.map(entrada => ({
            id: entrada.id as number,
            date: entrada.data as string,
            tempoTrabalhado: entrada.tempo_trabalhado as number,
            numeroCorridasUber: entrada.numero_corridas_uber as number,
            kmRodadosUber: entrada.km_rodados_uber as number,
            numeroCorridas99: entrada.numero_corridas_99 as number,
            kmRodados99: entrada.km_rodados_99 as number,
            ganhosUber: entrada.ganhos_uber as number,
            ganhos99: entrada.ganhos_99 as number,
            gastos: gastos?.filter(gasto => gasto.entrada_diaria_id === entrada.id).map(gasto => ({
                id: gasto.id as number,
                valor: gasto.valor as number,
                categoria: gasto.categoria as string,
                entrada_diaria_id: gasto.entrada_diaria_id as number | undefined
            })) || []
        })) || [];

        return records;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
};

export const addDailyRecord = async (supabase: ReturnType<typeof createClient>, record: Omit<DailyRecord, 'id'>, toast: ReturnType<typeof useToast>['toast']) => {
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
    }
};

export const updateDailyRecord = async (supabase: ReturnType<typeof createClient>, id: number, record: Partial<DailyRecord>, dailyRecords: DailyRecord[], toast: ReturnType<typeof useToast>['toast']) => {
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
    }
};

export const deleteDailyRecord = async (supabase: ReturnType<typeof createClient>, id: number, toast: ReturnType<typeof useToast>['toast']) => {
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
    }
};