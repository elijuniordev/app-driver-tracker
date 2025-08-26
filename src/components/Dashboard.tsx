import { useState, useEffect } from "react";
import { TrendingUp, Clock, Route, DollarSign, AlertTriangle, Car, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDriverData } from "@/hooks/useDriverData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { StatCard } from "./dashboard/StatCard";
import { getDailyAnalysis, getWeeklyAnalysis, getWeekStart, WeeklyAnalysis } from "./dashboard/dashboard-helpers";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StatCardsSection } from "./dashboard/StatCardsSection";
import { WeeklyEarningsChart } from "./dashboard/WeeklyEarningsChart";
import { ExpenseDistributionChart } from "./dashboard/ExpenseDistributionChart";
import { PlatformBreakdownCard } from "./dashboard/PlatformBreakdownCard";
import { EfficiencyMetricsCard } from "./dashboard/EfficiencyMetricsCard";

export const EnhancedDashboard = () => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('weekly');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { dailyRecords, loading, carConfig, fetchDailyRecords } = useDriverData();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    fetchDailyRecords();
  }, [fetchDailyRecords]);

  let analyzedData;
  let expensesByCategory: Record<string, number> = {};

  const currentDayString = format(selectedDate, "yyyy-MM-dd");

  if (viewMode === 'daily') {
    analyzedData = getDailyAnalysis(currentDayString, dailyRecords, carConfig);
    expensesByCategory = analyzedData?.expensesByCategory || {};
  } else {
    analyzedData = getWeeklyAnalysis(currentDayString, dailyRecords, carConfig);
    expensesByCategory = (analyzedData as WeeklyAnalysis)?.expensesByCategory || {};
  }
  
  const getWeeklyEarningsData = () => {
    const weekStartString = getWeekStart(currentDayString);
    const weekData = [];

    const weekStartDate = new Date(`${weekStartString}T00:00:00`);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStartDate);
      currentDate.setDate(weekStartDate.getDate() + i);
      const dateString = format(currentDate, "yyyy-MM-dd");
      const dayData = getDailyAnalysis(dateString, dailyRecords, carConfig);

      weekData.push({
        dia: format(currentDate, "E", { locale: ptBR }),
        uber: dayData?.ganhosUber || 0,
        '99': dayData?.ganhos99 || 0,
        total: (dayData?.ganhosUber || 0) + (dayData?.ganhos99 || 0)
      });
    }
    return weekData;
  };

  const getExpenseDistributionData = () => {
    // Definindo uma paleta de cores para os gastos
    const colors = [
      'hsl(var(--destructive))', // Cor para gastos
      'hsl(var(--primary))',
      'hsl(var(--secondary))',
      'hsl(var(--warning))',
      'hsl(var(--info))',
      '#8dd1e1',
      '#d084d0'
    ];
    const expenseEntries = Object.entries(expensesByCategory).filter(([name, value]) => value > 0);

    return expenseEntries.map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  };

  const weeklyEarningsData = getWeeklyEarningsData();
  const expenseData = getExpenseDistributionData();

  const netProfit = analyzedData?.lucroLiquido || 0;
  const earningsPerHour = (analyzedData?.tempoTotalTrabalhado || analyzedData?.tempoTrabalhado || 0) > 0 ? (analyzedData?.lucroLiquido || 0) / ((analyzedData?.tempoTotalTrabalhado || analyzedData?.tempoTrabalhado || 0) / 60) : 0;
  const costPerKm = (analyzedData?.kmTotais || analyzedData?.kmRodados || 0) > 0 ? (analyzedData?.gastosTotal || 0) / (analyzedData?.kmTotais || analyzedData?.kmRodados || 0) : 0;
  const totalTimeInHours = (analyzedData?.tempoTotalTrabalhado || analyzedData?.tempoTrabalhado || 0) / 60;
  const totalKm = (analyzedData?.kmTotais || analyzedData?.kmRodados || 0);

  const today = new Date();
  const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const selectedWeekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

  const formatWeekForDisplay = () => {
    const start = format(selectedWeekStart, "dd/MM", { locale: ptBR });
    const end = format(selectedWeekEnd, "dd/MM", { locale: ptBR });
    return `${start} - ${end}`;
  };

  return (
    <div className="p-4 pb-20 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            {viewMode === 'daily' ? 'Resumo do dia' : 'Resumo da semana'}
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
          </div>

          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-auto justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {viewMode === 'daily'
                  ? format(selectedDate, "PPP", { locale: ptBR })
                  : formatWeekForDisplay()}
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
              ) : (
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
            totalTimeInHours={totalTimeInHours}
            totalKm={totalKm}
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
              ganhosUber={analyzedData?.ganhosUber || 0}
              ganhos99={analyzedData?.ganhos99 || 0}
              dailyRecords={dailyRecords}
            />
            <EfficiencyMetricsCard
              consumoKmL={carConfig.consumoKmL}
              totalExpenses={analyzedData?.gastosTotal || 0}
              totalTimeInHours={totalTimeInHours}
            />
          </div>
        </div>
      )}
    </div>
  );
};