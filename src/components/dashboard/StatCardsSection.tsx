import { DollarSign, Clock, Route, Car } from "lucide-react";
import { StatCard } from "./StatCard";
import { DailyRecord, CarConfig } from "@/hooks/useDriverData";
import { getDailyAnalysis, getWeeklyAnalysis, getMonthlyAnalysis, WeeklyAnalysis, MonthlyAnalysis } from "./dashboard-helpers";

interface StatCardsSectionProps {
  analyzedData: ReturnType<typeof getDailyAnalysis> | WeeklyAnalysis | MonthlyAnalysis | null;
  viewMode: 'daily' | 'weekly' | 'monthly';
}

export const StatCardsSection = ({ analyzedData, viewMode }: StatCardsSectionProps) => {
  let totalTimeInHours = 0;
  let totalKm = 0;
  let netProfit = 0;
  let totalExpenses = 0;

  if (viewMode === 'daily' && analyzedData && 'tempoTrabalhado' in analyzedData) {
    totalTimeInHours = (analyzedData.tempoTrabalhado || 0) / 60;
    totalKm = (analyzedData.kmRodados || 0);
    netProfit = analyzedData.lucroLiquido;
    totalExpenses = analyzedData.gastosTotal;
  } else if (viewMode === 'weekly' && analyzedData && 'tempoTotalTrabalhado' in analyzedData) {
    totalTimeInHours = (analyzedData.tempoTotalTrabalhado || 0) / 60;
    totalKm = (analyzedData.kmTotais || 0);
    netProfit = analyzedData.lucroLiquido;
    totalExpenses = analyzedData.gastosTotal;
  } else if (viewMode === 'monthly' && analyzedData && 'tempoTotalTrabalhado' in analyzedData) {
    totalTimeInHours = (analyzedData.tempoTotalTrabalhado || 0) / 60;
    totalKm = (analyzedData.kmTotais || 0);
    netProfit = analyzedData.lucroLiquido;
    totalExpenses = analyzedData.gastosTotal;
  }

  const earningsPerHour = totalTimeInHours > 0 ? (netProfit / totalTimeInHours) : 0;
  const costPerKm = totalKm > 0 ? (totalExpenses / totalKm) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Lucro Líquido"
        value={`R$ ${netProfit.toFixed(2)}`}
        subtitle={viewMode === 'daily' ? 'Hoje' : viewMode === 'weekly' ? 'Esta semana' : 'Este mês'}
        icon={DollarSign}
        variant={netProfit > 0 ? 'success' : 'destructive'}
        trend={netProfit > 0 ? 'up' : 'down'}
      />
      <StatCard
        title="Ganho por Hora"
        value={`R$ ${earningsPerHour.toFixed(2)}`}
        subtitle={`${totalTimeInHours.toFixed(1)}h trabalhadas`}
        icon={Clock}
        variant="default"
      />
      <StatCard
        title="Custo por KM"
        value={`R$ ${costPerKm.toFixed(2)}`}
        subtitle={`${totalKm.toFixed(1)} km rodados`}
        icon={Route}
        variant="warning"
      />
      <StatCard
        title="Total de Gastos"
        value={`R$ ${totalExpenses.toFixed(2)}`}
        subtitle={viewMode === 'daily' ? 'Hoje' : viewMode === 'weekly' ? 'Esta semana' : 'Este mês'}
        icon={Car}
        variant="warning"
      />
    </div>
  );
};