export interface CarConfig {
  modelo: string;
  aluguelSemanal: number;
  limiteKmSemanal: number;
  valorKmExcedido: number;
  consumoKmL: number;
  precoCombustivel: number;
  dataInicioContrato: string;
  duracaoContratoDias: number;
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