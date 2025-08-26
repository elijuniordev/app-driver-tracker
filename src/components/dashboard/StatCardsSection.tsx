import { DollarSign, Clock, Route, Car } from "lucide-react";
import { StatCard } from "./StatCard";
import { getDailyAnalysis, getWeeklyAnalysis, WeeklyAnalysis } from "./dashboard-helpers";

interface StatCardsSectionProps {
  analyzedData: ReturnType<typeof getDailyAnalysis> | WeeklyAnalysis | null;
  viewMode: 'daily' | 'weekly';
  totalTimeInHours: number;
  totalKm: number;
}

export const StatCardsSection = ({ analyzedData, viewMode, totalTimeInHours, totalKm }: StatCardsSectionProps) => {
  const netProfit = analyzedData?.lucroLiquido || 0;
  const earningsPerHour = totalTimeInHours > 0 ? (analyzedData?.lucroLiquido || 0) / totalTimeInHours : 0;
  const costPerKm = totalKm > 0 ? (analyzedData?.gastosTotal || 0) / totalKm : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Lucro Líquido"
        value={`R$ ${netProfit.toFixed(2)}`}
        subtitle={viewMode === 'daily' ? 'Hoje' : 'Esta semana'}
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
        value={`R$ ${(analyzedData?.gastosTotal || 0).toFixed(2)}`}
        subtitle={viewMode === 'daily' ? 'Hoje' : 'Esta semana'}
        icon={Car}
        variant="warning"
      />
    </div>
  );
};