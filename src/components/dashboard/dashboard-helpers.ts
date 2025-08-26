// src/components/dashboard/dashboard-helpers.ts
import { DailyRecord, CarConfig } from "@/hooks/useDriverData";

export interface DailyTotals {
  date: string;
  totalEarnings: number;
  uberEarnings: number;
  nineNineEarnings: number;
  totalKm: number;
  totalTime: number;
  avgConsumption: number;
  totalExpenses: number;
  expensesByCategory: Record<string, number>;
}

export const getWeekStart = (date: string): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
};

export const getDailyAnalysis = (date: string, records: DailyRecord[], carConfig: CarConfig) => {
    const record = records.find(r => r.date === date);
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
  };

export const getWeeklyAnalysis = (startDate: string, records: DailyRecord[], carConfig: CarConfig) => {
  const start = new Date(getWeekStart(startDate));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const weekRecords = records.filter(record => {
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
};