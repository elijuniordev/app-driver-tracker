import { DailyRecord, CarConfig } from "@/hooks/useDriverData";
import { startOfWeek, addDays, isWithinInterval, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { createLocalDate } from "@/lib/utils";

// Interface unificada para análise
export interface PerformanceAnalysis {
  ganhosBrutos: number;
  ganhosUber: number;
  ganhos99: number;
  ganhosExtras: number;
  gastosTotal: number;
  lucroLiquido: number;
  kmTotais: number;
  tempoTotalTrabalhado: number; // em minutos
  totalViagens: number;
  faturamentoPorViagem: number;
  custoPorViagem: number;
  lucroPorViagem: number;
  faturamentoPorHora: number;
  custoPorHora: number;
  lucroPorHora: number;
  faturamentoPorKm: number;
  custoPorKm: number;
  lucroPorKm: number;
  expensesByCategory: Record<string, number>;
  earningsByCategory: Record<string, number>;
}

export type MonthlyAnalysis = PerformanceAnalysis;

export const getWeekStart = (dateString: string): string => {
  const d = createLocalDate(dateString);
  return startOfWeek(d, { weekStartsOn: 1 }).toISOString().split('T')[0];
};

const isWithinContract = (date: Date, carConfig: CarConfig): boolean => {
  if (!carConfig.dataInicioContrato || !carConfig.duracaoContratoDias) return false;
  const startDate = createLocalDate(carConfig.dataInicioContrato);
  const endDate = addDays(startDate, carConfig.duracaoContratoDias);
  return isWithinInterval(date, { start: startDate, end: endDate });
};

const calculateMetricsForPeriod = (
  records: DailyRecord[],
  carConfig: CarConfig,
  interval?: { start: Date; end: Date }
): PerformanceAnalysis => {

  const ganhosUber = records.reduce((sum, r) => sum + r.ganhosUber, 0);
  const ganhos99 = records.reduce((sum, r) => sum + r.ganhos99, 0);
  const ganhosExtras = records.reduce((sum, r) => sum + (r.ganhosExtras?.reduce((eSum, e) => eSum + e.valor, 0) || 0), 0);
  const ganhosBrutos = ganhosUber + ganhos99 + ganhosExtras;
  
  const kmTotais = records.reduce((sum, r) => sum + r.kmRodadosUber + r.kmRodados99, 0);
  const tempoTotalTrabalhado = records.reduce((sum, r) => sum + r.tempoTrabalhado, 0);
  const totalViagens = records.reduce((sum, r) => sum + r.numeroCorridasUber + r.numeroCorridas99, 0);

  const expensesByCategory: Record<string, number> = {};
  const earningsByCategory: Record<string, number> = {};
  if (ganhosUber > 0) earningsByCategory['Uber'] = ganhosUber;
  if (ganhos99 > 0) earningsByCategory['99'] = ganhos99;

  records.forEach(record => {
    record.gastos?.forEach(gasto => {
      expensesByCategory[gasto.categoria] = (expensesByCategory[gasto.categoria] || 0) + gasto.valor;
    });
    
    record.ganhosExtras?.forEach(ganho => {
        earningsByCategory[ganho.categoria] = (earningsByCategory[ganho.categoria] || 0) + ganho.valor;
    });
  });

  if (carConfig.is_active) {
    if (interval && carConfig.aluguelSemanal > 0) {
      const daysInContractThisPeriod = eachDayOfInterval(interval).filter(day => isWithinContract(day, carConfig)).length;
      const aluguelProporcional = (carConfig.aluguelSemanal / 7) * daysInContractThisPeriod;
      if (aluguelProporcional > 0) {
        expensesByCategory['Aluguel'] = (expensesByCategory['Aluguel'] || 0) + aluguelProporcional;
      }
    }
    if (kmTotais > carConfig.limiteKmSemanal && interval && (interval.end.getDate() - interval.start.getDate()) <= 7) {
      const kmExcedidos = kmTotais - carConfig.limiteKmSemanal;
      const custoKmExcedido = kmExcedidos * carConfig.valorKmExcedido;
      if (custoKmExcedido > 0) {
        expensesByCategory['KM Excedido'] = (expensesByCategory['KM Excedido'] || 0) + custoKmExcedido;
      }
    }
  }

  const gastosTotal = Object.values(expensesByCategory).reduce((sum, value) => sum + value, 0);
  const lucroLiquido = ganhosBrutos - gastosTotal;
  const tempoEmHoras = tempoTotalTrabalhado / 60;

  return {
    ganhosBrutos, gastosTotal, lucroLiquido, kmTotais, tempoTotalTrabalhado, totalViagens, ganhosUber, ganhos99, ganhosExtras,
    expensesByCategory, earningsByCategory,
    faturamentoPorViagem: totalViagens > 0 ? ganhosBrutos / totalViagens : 0,
    custoPorViagem: totalViagens > 0 ? gastosTotal / totalViagens : 0,
    lucroPorViagem: totalViagens > 0 ? lucroLiquido / totalViagens : 0,
    faturamentoPorHora: tempoEmHoras > 0 ? ganhosBrutos / tempoEmHoras : 0,
    custoPorHora: tempoEmHoras > 0 ? gastosTotal / tempoEmHoras : 0,
    lucroPorHora: tempoEmHoras > 0 ? lucroLiquido / tempoEmHoras : 0,
    faturamentoPorKm: kmTotais > 0 ? ganhosBrutos / kmTotais : 0,
    custoPorKm: kmTotais > 0 ? gastosTotal / kmTotais : 0,
    lucroPorKm: kmTotais > 0 ? lucroLiquido / kmTotais : 0,
  };
};

export const getDailyAnalysis = (date: string, records: DailyRecord[], carConfig: CarConfig): PerformanceAnalysis | null => {
  const record = records.find(r => r.date === date);
  if (!record) return null;
  return calculateMetricsForPeriod([record], carConfig, {start: createLocalDate(date), end: createLocalDate(date)});
};

export const getWeeklyAnalysis = (startDate: string, records: DailyRecord[], carConfig: CarConfig): PerformanceAnalysis => {
  const start = createLocalDate(getWeekStart(startDate));
  const end = addDays(start, 6);
  const weekRecords = records.filter(r => isWithinInterval(createLocalDate(r.date), { start, end }));
  return calculateMetricsForPeriod(weekRecords, carConfig, { start, end });
};

export const getMonthlyAnalysis = (dateString: string, records: DailyRecord[], carConfig: CarConfig): PerformanceAnalysis => {
  const date = createLocalDate(dateString);
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const monthRecords = records.filter(r => isWithinInterval(createLocalDate(r.date), { start, end }));
  return calculateMetricsForPeriod(monthRecords, carConfig, { start, end });
};