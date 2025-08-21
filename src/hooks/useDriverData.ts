import { useState, useEffect } from 'react';

export interface CarConfig {
  modelo: string;
  aluguelSemanal: number;
  limiteKmSemanal: number;
  valorKmExcedido: number;
}

export interface DailyRecord {
  id: string;
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
  id: string;
  valor: number;
  categoria: string;
}

const STORAGE_KEYS = {
  CAR_CONFIG: 'driver-tracker-car-config',
  DAILY_RECORDS: 'driver-tracker-daily-records',
};

const defaultCarConfig: CarConfig = {
  modelo: '',
  aluguelSemanal: 0,
  limiteKmSemanal: 0,
  valorKmExcedido: 0,
};

export const useDriverData = () => {
  const [carConfig, setCarConfig] = useState<CarConfig>(defaultCarConfig);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedCarConfig = localStorage.getItem(STORAGE_KEYS.CAR_CONFIG);
    const savedDailyRecords = localStorage.getItem(STORAGE_KEYS.DAILY_RECORDS);

    if (savedCarConfig) {
      setCarConfig(JSON.parse(savedCarConfig));
    }

    if (savedDailyRecords) {
      setDailyRecords(JSON.parse(savedDailyRecords));
    }
  }, []);

  // Helper functions
  const saveCarConfig = (config: CarConfig) => {
    setCarConfig(config);
    localStorage.setItem(STORAGE_KEYS.CAR_CONFIG, JSON.stringify(config));
  };

  const addDailyRecord = (record: Omit<DailyRecord, 'id'>) => {
    const newRecord: DailyRecord = {
      ...record,
      id: Date.now().toString(),
    };

    const updatedRecords = [...dailyRecords, newRecord];
    setDailyRecords(updatedRecords);
    localStorage.setItem(STORAGE_KEYS.DAILY_RECORDS, JSON.stringify(updatedRecords));
  };

  const updateDailyRecord = (id: string, record: Partial<DailyRecord>) => {
    const updatedRecords = dailyRecords.map(r => 
      r.id === id ? { ...r, ...record } : r
    );
    setDailyRecords(updatedRecords);
    localStorage.setItem(STORAGE_KEYS.DAILY_RECORDS, JSON.stringify(updatedRecords));
  };

  const deleteDailyRecord = (id: string) => {
    const updatedRecords = dailyRecords.filter(r => r.id !== id);
    setDailyRecords(updatedRecords);
    localStorage.setItem(STORAGE_KEYS.DAILY_RECORDS, JSON.stringify(updatedRecords));
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
    saveCarConfig,
    addDailyRecord,
    updateDailyRecord,
    deleteDailyRecord,
    getDailyAnalysis,
    getWeeklyAnalysis,
  };
};