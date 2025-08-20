import { useState, useEffect } from 'react';

export interface CarConfig {
  modelo: string;
  aluguelSemanal: number;
  limiteKmSemanal: number;
  valorKmExcedido: number;
  eficienciaKmL: number;
}

export interface DailyRecord {
  id: string;
  date: string;
  tempoTrabalhado: number; // em minutos
  numCorridas: number;
  kmRodados: number;
  valorBruto: number;
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
  eficienciaKmL: 0,
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
    const lucroLiquido = record.valorBruto - totalGastos;
    const ganhoPorHora = record.tempoTrabalhado > 0 ? lucroLiquido / (record.tempoTrabalhado / 60) : 0;
    const ganhoPorMinuto = record.tempoTrabalhado > 0 ? lucroLiquido / record.tempoTrabalhado : 0;

    return {
      ganhosBrutos: record.valorBruto,
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
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const weekRecords = dailyRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= start && recordDate <= end;
    });

    const ganhosBrutos = weekRecords.reduce((sum, record) => sum + record.valorBruto, 0);
    const gastosRegistrados = weekRecords.reduce((sum, record) => 
      sum + record.gastos.reduce((gastoSum, gasto) => gastoSum + gasto.valor, 0), 0
    );
    
    const kmTotais = weekRecords.reduce((sum, record) => sum + record.kmRodados, 0);
    const kmExcedidos = Math.max(0, kmTotais - carConfig.limiteKmSemanal);
    const custoKmExcedido = kmExcedidos * carConfig.valorKmExcedido;
    
    const gastosTotal = gastosRegistrados + carConfig.aluguelSemanal + custoKmExcedido;
    const lucroLiquido = ganhosBrutos - gastosTotal;

    return {
      ganhosBrutos,
      gastosRegistrados,
      aluguelSemanal: carConfig.aluguelSemanal,
      custoKmExcedido,
      gastosTotal,
      lucroLiquido,
      kmTotais,
      kmExcedidos,
      limiteKm: carConfig.limiteKmSemanal,
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