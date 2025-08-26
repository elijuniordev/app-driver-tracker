import { DailyRecord, CarConfig } from "@/hooks/useDriverData";
import { startOfWeek, addDays, isWithinInterval, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { createLocalDate } from "@/lib/utils";

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

export interface MonthlyAnalysis {
  ganhosBrutos: number;
  ganhosUber: number;
  ganhos99: number;
  gastosRegistrados: number;
  aluguelTotal: number;
  custoKmExcedido: number;
  gastosTotal: number;
  lucroLiquido: number;
  kmTotais: number;
  kmExcedidos: number;
  limiteKm: number;
  ganhoPorHora: number;
  tempoTotalTrabalhado: number;
  periodoMensal: {
    inicio: string;
    fim: string;
  };
  expensesByCategory: Record<string, number>;
}

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

// Nova função para verificar se uma data está dentro do período de contrato
const isWithinContract = (date: Date, carConfig: CarConfig): boolean => {
  if (!carConfig.dataInicioContrato || !carConfig.duracaoContratoDias) {
    return false;
  }
  const startDate = createLocalDate(carConfig.dataInicioContrato);
  const endDate = addDays(startDate, carConfig.duracaoContratoDias);
  return isWithinInterval(date, { start: startDate, end: endDate });
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
    gastos: totalGastos,
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

  weekRecords.forEach(record => {
    record.gastos.forEach(gasto => {
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

  // Lógica para aluguel semanal proporcional dentro do contrato
  let aluguelProporcional = 0;
  if (carConfig.aluguelSemanal > 0 && carConfig.dataInicioContrato) {
    const totalDaysInWeek = 7;
    const daysInContractThisWeek = eachDayOfInterval({ start, end }).filter(day => isWithinContract(day, carConfig)).length;
    aluguelProporcional = (carConfig.aluguelSemanal / totalDaysInWeek) * daysInContractThisWeek;
  }
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

export const getMonthlyAnalysis = (dateString: string, records: DailyRecord[], carConfig: CarConfig): MonthlyAnalysis => {
  const date = createLocalDate(dateString);
  const start = startOfMonth(date);
  const end = endOfMonth(date);

  const monthRecords = records.filter(record => {
    const recordDate = createLocalDate(record.date);
    return isWithinInterval(recordDate, { start, end });
  });

  const ganhosUber = monthRecords.reduce((sum, record) => sum + record.ganhosUber, 0);
  const ganhos99 = monthRecords.reduce((sum, record) => sum + record.ganhos99, 0);
  const ganhosBrutos = ganhosUber + ganhos99;

  const expensesByCategory: Record<string, number> = {};

  const kmTotais = monthRecords.reduce((sum, record) => sum + record.kmRodadosUber + record.kmRodados99, 0);
  const combustivelCalculado = calculateFuelCost(kmTotais, carConfig);

  monthRecords.forEach(record => {
    record.gastos.forEach(gasto => {
      if (gasto.categoria !== 'Combustível') {
        expensesByCategory[gasto.categoria] = (expensesByCategory[gasto.categoria] || 0) + gasto.valor;
      }
    });
  });

  if (combustivelCalculado > 0) {
    expensesByCategory['Combustível'] = (expensesByCategory['Combustível'] || 0) + combustivelCalculado;
  }

  const numWeeksInMonth = Math.ceil((end.getDate() + start.getDay()) / 7);

  // Lógica para aluguel mensal, considerando o período do contrato
  let aluguelTotal = 0;
  if (carConfig.aluguelSemanal > 0 && carConfig.dataInicioContrato) {
    const monthDays = eachDayOfInterval({ start, end });
    const daysInContractThisMonth = monthDays.filter(day => isWithinContract(day, carConfig)).length;

    // Aluguel semanal multiplicado pelo número de semanas dentro do contrato no mês
    const weeksInContractThisMonth = Math.ceil(daysInContractThisMonth / 7);
    aluguelTotal = carConfig.aluguelSemanal * weeksInContractThisMonth;
  }

  const kmExcedidos = Math.max(0, kmTotais - (carConfig.limiteKmSemanal * numWeeksInMonth));
  const custoKmExcedido = kmExcedidos * carConfig.valorKmExcedido;

  if (aluguelTotal > 0) {
    expensesByCategory['Aluguel Mensal'] = (expensesByCategory['Aluguel Mensal'] || 0) + aluguelTotal;
  }

  if (custoKmExcedido > 0) {
    expensesByCategory['KM Excedido'] = (expensesByCategory['KM Excedido'] || 0) + custoKmExcedido;
  }

  const gastosTotal = Object.values(expensesByCategory).reduce((sum, value) => sum + value, 0);
  const lucroLiquido = ganhosBrutos - gastosTotal;
  const tempoTotalTrabalhado = monthRecords.reduce((sum, record) => sum + record.tempoTrabalhado, 0);
  const ganhoPorHora = tempoTotalTrabalhado > 0 ? (lucroLiquido / (tempoTotalTrabalhado / 60)) : 0;

  return {
    ganhosBrutos,
    ganhosUber,
    ganhos99,
    gastosRegistrados: Object.values(expensesByCategory).reduce((sum, value) => sum + value, 0),
    aluguelTotal,
    custoKmExcedido,
    gastosTotal,
    lucroLiquido,
    kmTotais,
    kmExcedidos,
    limiteKm: carConfig.limiteKmSemanal,
    ganhoPorHora,
    tempoTotalTrabalhado,
    periodoMensal: {
      inicio: start.toISOString().split('T')[0],
      fim: end.toISOString().split('T')[0],
    },
    expensesByCategory,
  };
};