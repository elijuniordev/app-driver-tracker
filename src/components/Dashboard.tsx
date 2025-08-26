import { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDriverData } from "@/hooks/useDriverData";
import { getDailyAnalysis, getWeeklyAnalysis, getMonthlyAnalysis, PerformanceAnalysis } from "./dashboard/dashboard-helpers";
import { WeeklyEarningsChart } from "./dashboard/WeeklyEarningsChart";
import { ExpenseDistributionChart } from "./dashboard/ExpenseDistributionChart";
import { KeyMetricsCard } from "./dashboard/KeyMetricsCard";
import { GeneralSummaryCard } from "./dashboard/GeneralSummaryCard";
import { MetricTabsCard } from "./dashboard/MetricTabsCard";
import { GoalProgressCard } from "./dashboard/GoalProgressCard";
import { MileageControlCard } from "./dashboard/MileageControlCard";

export const EnhancedDashboard = () => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { dailyRecords, loading, carConfig } = useDriverData();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  let analyzedData: PerformanceAnalysis | null = null;
  const currentDayString = format(selectedDate, "yyyy-MM-dd");

  if (dailyRecords.length > 0 && carConfig) {
    if (viewMode === 'daily') {
      analyzedData = getDailyAnalysis(currentDayString, dailyRecords, carConfig);
    } else if (viewMode === 'weekly') {
      analyzedData = getWeeklyAnalysis(currentDayString, dailyRecords, carConfig);
    } else {
      analyzedData = getMonthlyAnalysis(currentDayString, dailyRecords, carConfig);
    }
  }

  const today = new Date();
  const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const selectedWeekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

  const formatPeriodForDisplay = () => {
    if (viewMode === 'daily') {
      return format(selectedDate, "PPP", { locale: ptBR });
    } else if (viewMode === 'weekly') {
      const start = format(selectedWeekStart, "dd/MM");
      const end = format(selectedWeekEnd, "dd/MM/yyyy");
      return `${start} - ${end}`;
    } else {
      return format(selectedDate, "MMMM yyyy", { locale: ptBR });
    }
  };

  return (
    <div className="p-4 pb-20 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">{formatPeriodForDisplay()}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2">
            <Button variant={viewMode === 'daily' ? 'default' : 'outline'} onClick={() => setViewMode('daily')} size="sm">Diário</Button>
            <Button variant={viewMode === 'weekly' ? 'default' : 'outline'} onClick={() => setViewMode('weekly')} size="sm">Semanal</Button>
            <Button variant={viewMode === 'monthly' ? 'default' : 'outline'} onClick={() => setViewMode('monthly')} size="sm">Mensal</Button>
          </div>
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className="w-auto justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" /><span>Selecionar Data</span></Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(day) => { if (day) { setSelectedDate(day); setIsPopoverOpen(false); } }}
                  initialFocus
                  locale={ptBR}
                  weekStartsOn={1}
                  modifiers={{
                    today,
                    selectedWeek: viewMode === 'weekly' ? { from: selectedWeekStart, to: selectedWeekEnd } : undefined,
                    selectedMonth: viewMode === 'monthly' ? { from: startOfMonth(selectedDate), to: endOfMonth(selectedDate) } : undefined,
                  }}
                  modifiersClassNames={{
                    today: "bg-blue-500 text-white rounded-full",
                    selectedWeek: "bg-green-200 text-green-900",
                    selectedMonth: "bg-green-200 text-green-900",
                    selected: "bg-green-600 text-white rounded-full",
                  }}
                />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {loading ? ( <p className="text-center">Carregando dados...</p> ) : 
       analyzedData ? (
        <div className="space-y-6">
          <KeyMetricsCard lucroLiquido={analyzedData.lucroLiquido} ganhosBrutos={analyzedData.ganhosBrutos} gastosTotal={analyzedData.gastosTotal} />
          {viewMode === 'weekly' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GoalProgressCard currentEarnings={analyzedData.lucroLiquido} goal={carConfig.metaGanhosSemanal} viewMode="weekly" />
              <MileageControlCard currentKm={analyzedData.kmTotais} limitKm={carConfig.limiteKmSemanal} />
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2"><MetricTabsCard metrics={analyzedData} /></div>
            <GeneralSummaryCard totalViagens={analyzedData.totalViagens} horasTrabalhadas={analyzedData.tempoTotalTrabalhado} kmsRodados={analyzedData.kmTotais} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WeeklyEarningsChart currentDayString={currentDayString} dailyRecords={dailyRecords} carConfig={carConfig} />
            <ExpenseDistributionChart expensesByCategory={analyzedData.expensesByCategory} />
          </div>
        </div>
      ) : (
        <div className="text-center py-10"><p className="text-muted-foreground">Nenhum dado encontrado para o período selecionado.</p></div>
      )}
    </div>
  );
};