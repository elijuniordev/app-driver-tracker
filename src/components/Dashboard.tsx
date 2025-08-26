import { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDriverData } from "@/hooks/useDriverData";
import { getDailyAnalysis, getWeeklyAnalysis, getMonthlyAnalysis, WeeklyAnalysis, MonthlyAnalysis } from "./dashboard/dashboard-helpers";
import { StatCardsSection } from "./dashboard/StatCardsSection";
import { WeeklyEarningsChart } from "./dashboard/WeeklyEarningsChart";
import { ExpenseDistributionChart } from "./dashboard/ExpenseDistributionChart";
import { PlatformBreakdownCard } from "./dashboard/PlatformBreakdownCard";
import { EfficiencyMetricsCard } from "./dashboard/EfficiencyMetricsCard";

// Definindo o tipo de dado para a análise do dashboard
type AnalyzedDataType = ReturnType<typeof getDailyAnalysis> | WeeklyAnalysis | MonthlyAnalysis;

export const EnhancedDashboard = () => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { dailyRecords, loading, carConfig, fetchDailyRecords } = useDriverData();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    fetchDailyRecords();
  }, [fetchDailyRecords]);

  let analyzedData: AnalyzedDataType | null;
  let expensesByCategory: Record<string, number> = {};

  const currentDayString = format(selectedDate, "yyyy-MM-dd");

  if (viewMode === 'daily') {
    analyzedData = getDailyAnalysis(currentDayString, dailyRecords, carConfig);
  } else if (viewMode === 'weekly') {
    analyzedData = getWeeklyAnalysis(currentDayString, dailyRecords, carConfig);
  } else { // monthly
    analyzedData = getMonthlyAnalysis(currentDayString, dailyRecords, carConfig);
  }
  
  if (analyzedData) {
    expensesByCategory = analyzedData.expensesByCategory;
  }

  // Lógica corrigida para calcular as métricas com base no modo de visualização
  let totalTimeInHours = 0;
  let totalKm = 0;
  let ganhosUber = 0;
  let ganhos99 = 0;
  let totalExpenses = 0;

  if (viewMode === 'daily' && analyzedData) {
    totalTimeInHours = (analyzedData.tempoTrabalhado || 0) / 60;
    totalKm = (analyzedData.kmRodados || 0);
    ganhosUber = analyzedData.ganhosUber || 0;
    ganhos99 = analyzedData.ganhos99 || 0;
    totalExpenses = analyzedData.gastosTotal || 0;
  } else if ((viewMode === 'weekly' || viewMode === 'monthly') && analyzedData) {
    totalTimeInHours = (analyzedData.tempoTotalTrabalhado || 0) / 60;
    totalKm = (analyzedData.kmTotais || 0);
    ganhosUber = analyzedData.ganhosUber || 0;
    ganhos99 = analyzedData.ganhos99 || 0;
    totalExpenses = analyzedData.gastosTotal || 0;
  }

  const today = new Date();
  const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const selectedWeekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const selectedMonthStart = startOfMonth(selectedDate);
  const selectedMonthEnd = endOfMonth(selectedDate);

  const formatPeriodForDisplay = () => {
    if (viewMode === 'daily') {
      return format(selectedDate, "PPP", { locale: ptBR });
    } else if (viewMode === 'weekly') {
      const start = format(selectedWeekStart, "dd/MM", { locale: ptBR });
      const end = format(selectedWeekEnd, "dd/MM", { locale: ptBR });
      return `${start} - ${end}`;
    } else { // monthly
      return format(selectedDate, "MMMM yyyy", { locale: ptBR });
    }
  };

  return (
    <div className="p-4 pb-20 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            {viewMode === 'daily' ? 'Resumo do dia' : viewMode === 'weekly' ? 'Resumo da semana' : 'Resumo do mês'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'daily' ? 'default' : 'outline'}
              onClick={() => setViewMode('daily')}
              size="sm"
            >
              Diário
            </Button>
            <Button
              variant={viewMode === 'weekly' ? 'default' : 'outline'}
              onClick={() => setViewMode('weekly')}
              size="sm"
            >
              Semanal
            </Button>
            <Button
              variant={viewMode === 'monthly' ? 'default' : 'outline'}
              onClick={() => setViewMode('monthly')}
              size="sm"
            >
              Mensal
            </Button>
          </div>

          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-auto justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatPeriodForDisplay()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              {viewMode === "daily" ? (
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(day) => {
                    if (!day) return;
                    setSelectedDate(day);
                    setIsPopoverOpen(false);
                  }}
                  initialFocus
                  locale={ptBR}
                  weekStartsOn={1}
                  modifiers={{
                    today,
                  }}
                  modifiersClassNames={{
                    today: "bg-blue-500 text-white rounded-full",
                    selected: "bg-green-600 text-white rounded-full",
                  }}
                />
              ) : viewMode === "weekly" ? (
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(day) => {
                    if (!day) return;
                    setSelectedDate(day);
                    setIsPopoverOpen(false);
                  }}
                  initialFocus
                  locale={ptBR}
                  weekStartsOn={1}
                  modifiers={{
                    today,
                    selectedWeek: { from: selectedWeekStart, to: selectedWeekEnd },
                    selectedDay: selectedDate,
                  }}
                  modifiersClassNames={{
                    today: "bg-blue-500 text-white rounded-full",
                    selectedWeek: "bg-green-200 text-green-900",
                    selectedDay: "bg-green-600 text-white rounded-full",
                  }}
                />
              ) : ( // monthly view
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(day) => {
                    if (!day) return;
                    setSelectedDate(day);
                    setIsPopoverOpen(false);
                  }}
                  initialFocus
                  locale={ptBR}
                  weekStartsOn={1}
                  modifiers={{
                    today,
                    selectedMonth: { from: selectedMonthStart, to: selectedMonthEnd },
                  }}
                  modifiersClassNames={{
                    today: "bg-blue-500 text-white rounded-full",
                    selectedMonth: "bg-green-200 text-green-900",
                    selected: "bg-green-600 text-white rounded-full",
                  }}
                />
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {loading ? (
        <p>Carregando dados...</p>
      ) : (
        <div className="space-y-6">
          <StatCardsSection
            analyzedData={analyzedData}
            viewMode={viewMode}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WeeklyEarningsChart
              currentDayString={currentDayString}
              dailyRecords={dailyRecords}
              carConfig={carConfig}
            />
            <ExpenseDistributionChart
              expensesByCategory={expensesByCategory}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PlatformBreakdownCard
              ganhosUber={ganhosUber}
              ganhos99={ganhos99}
              dailyRecords={dailyRecords}
            />
            <EfficiencyMetricsCard
              consumoKmL={carConfig.consumoKmL}
              totalExpenses={totalExpenses}
              totalTimeInHours={totalTimeInHours}
            />
          </div>
        </div>
      )}
    </div>
  );
};