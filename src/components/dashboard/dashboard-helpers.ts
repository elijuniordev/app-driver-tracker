import { DailyRecord, CarConfig } from "@/hooks/useDriverData";
import { startOfWeek, addDays, isWithinInterval } from 'date-fns';

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

export interface WeeklyAnalysis {
  ganhosBrutos: number;
  ganhosUber: number;
  ganhos99: number;
  gastosRegistrados: number;
  aluguelSemanal: number;
  custoKmExcedido: number;
  gastosTotal: number;
  lucroLiquido: number;
  kmTotais: number;
  kmExcedidos: number;
  limiteKm: number;
  ganhoPorHora: number;
  tempoTotalTrabalhado: number;
  periodoSemana: {
    inicio: string;
    fim: string;
  };
  expensesByCategory: Record<string, number>;
}

const createLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const getWeekStart = (dateString: string): string => {
  const d = createLocalDate(dateString);
  return startOfWeek(d, { weekStartsOn: 1 }).toISOString().split('T')[0];
};

const calculateFuelCost = (totalKm: number, carConfig: CarConfig): number => {
  if (totalKm > 0 && carConfig.consumoKmL > 0 && carConfig.precoCombustivel > 0) {
    const litrosConsumidos = totalKm / carConfig.consumoKmL;
    return litrosConsumidos * carConfig.precoCombustivel;
  }
  return 0;
};

export const getDailyAnalysis = (date: string, records: DailyRecord[], carConfig: CarConfig) => {
  const record = records.find(r => r.date === date);
  if (!record) return null;

  const totalKm = record.kmRodadosUber + record.kmRodados99;
  const combustivelCalculado = calculateFuelCost(totalKm, carConfig);
  
  const expensesByCategory = record.gastos.reduce((acc, expense) => {
    acc[expense.categoria] = (acc[expense.categoria] || 0) + expense.valor;
    return acc;
  }, {} as Record<string, number>);

  if (combustivelCalculado > 0) {
    expensesByCategory['Combustível'] = (expensesByCategory['Combustível'] || 0) + combustivelCalculado;
  }

  const totalGastos = Object.values(expensesByCategory).reduce((sum, value) => sum + value, 0);
  const ganhosBrutos = record.ganhosUber + record.ganhos99;
  const lucroLiquido = ganhosBrutos - totalGastos;
  const ganhoPorHora = record.tempoTrabalhado > 0 ? lucroLiquido / (record.tempoTrabalhado / 60) : 0;
  const totalCorridas = record.numeroCorridasUber + record.numeroCorridas99;

  return {
    date: record.date,
    ganhosBrutos,
    ganhosUber: record.ganhosUber,
    ganhos99: record.ganhos99,
    gastosTotal: totalGastos,
    lucroLiquido,
    ganhoPorHora,
    tempoTrabalhado: record.tempoTrabalhado,
    numCorridas: totalCorridas,
    kmRodados: totalKm,
    numeroCorridasUber: record.numeroCorridasUber,
    kmRodadosUber: record.kmRodadosUber,
    numeroCorridas99: record.numeroCorridas99,
    kmRodados99: record.kmRodados99,
    expensesByCategory,
  };
};

export const getWeeklyAnalysis = (startDate: string, records: DailyRecord[], carConfig: CarConfig): WeeklyAnalysis => {
  const start = createLocalDate(getWeekStart(startDate));
  const end = addDays(start, 6);

  const weekRecords = records.filter(record => {
    const recordDate = createLocalDate(record.date);
    return isWithinInterval(recordDate, { start, end });
  });

  const ganhosUber = weekRecords.reduce((sum, record) => sum + record.ganhosUber, 0);
  const ganhos99 = weekRecords.reduce((sum, record) => sum + record.ganhos99, 0);
  const ganhosBrutos = ganhosUber + ganhos99;

  const expensesByCategory: Record<string, number> = {};
  
  const kmTotais = weekRecords.reduce((sum, record) => sum + record.kmRodadosUber + record.kmRodados99, 0);
  const combustivelCalculado = calculateFuelCost(kmTotais, carConfig);

  // Agrega todos os gastos por categoria, excluindo o combustível duplicado
  weekRecords.forEach(record => {
    record.gastos.forEach(gasto => {
      // Ignora combustível manual para evitar duplicidade com o cálculo automático
      if (gasto.categoria !== 'Combustível') {
        expensesByCategory[gasto.categoria] = (expensesByCategory[gasto.categoria] || 0) + gasto.valor;
      }
    });
  });

  if (combustivelCalculado > 0) {
    expensesByCategory['Combustível'] = (expensesByCategory['Combustível'] || 0) + combustivelCalculado;
  }
  
  const kmExcedidos = Math.max(0, kmTotais - carConfig.limiteKmSemanal);
  const custoKmExcedido = kmExcedidos * carConfig.valorKmExcedido;
  
  // Calcula o aluguel semanal proporcional aos dias trabalhados
  const diasTrabalhados = weekRecords.length;
  const aluguelProporcional = carConfig.aluguelSemanal > 0 && diasTrabalhados > 0 
    ? (carConfig.aluguelSemanal / 7) * diasTrabalhados 
    : 0;
  
  if (aluguelProporcional > 0) {
    expensesByCategory['Aluguel Semanal'] = (expensesByCategory['Aluguel Semanal'] || 0) + aluguelProporcional;
  }
  
  if (custoKmExcedido > 0) {
    expensesByCategory['KM Excedido'] = (expensesByCategory['KM Excedido'] || 0) + custoKmExcedido;
  }

  const gastosTotal = Object.values(expensesByCategory).reduce((sum, value) => sum + value, 0);
  const lucroLiquido = ganhosBrutos - gastosTotal;
  const tempoTotalTrabalhado = weekRecords.reduce((sum, record) => sum + record.tempoTrabalhado, 0);
  const ganhoPorHora = tempoTotalTrabalhado > 0 ? (lucroLiquido / (tempoTotalTrabalhado / 60)) : 0;
  
  return {
    ganhosBrutos,
    ganhosUber,
    ganhos99,
    gastosRegistrados: Object.values(expensesByCategory).reduce((sum, value) => sum + value, 0),
    aluguelSemanal: aluguelProporcional,
    custoKmExcedido,
    gastosTotal,
    lucroLiquido,
    kmTotais,
    kmExcedidos,
    limiteKm: carConfig.limiteKmSemanal,
    ganhoPorHora,
    tempoTotalTrabalhado,
    periodoSemana: {
      inicio: start.toISOString().split('T')[0],
      fim: end.toISOString().split('T')[0],
    },
    expensesByCategory,
  };
};