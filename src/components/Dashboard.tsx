import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Clock, Route, DollarSign, AlertTriangle, Car, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDriverData } from "@/hooks/useDriverData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { StatCard } from "./dashboard/StatCard";
import { DailyTotals, getDailyAnalysis, getWeeklyAnalysis, getWeekStart } from "./dashboard/dashboard-helpers";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

export const EnhancedDashboard = () => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { dailyRecords, loading, carConfig, fetchDailyRecords } = useDriverData();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    fetchDailyRecords();
  }, [fetchDailyRecords]);

  let dailyTotals: DailyTotals;
  let weeklyData: ReturnType<typeof getWeeklyAnalysis> | undefined;

  const currentDayString = format(selectedDate, "yyyy-MM-dd");
  
  if (viewMode === 'daily') {
    const dailyAnalysis = getDailyAnalysis(currentDayString, dailyRecords, carConfig);
    dailyTotals = dailyAnalysis ? {
      date: currentDayString,
      totalEarnings: dailyAnalysis.ganhosBrutos,
      uberEarnings: dailyAnalysis.ganhosUber,
      nineNineEarnings: dailyAnalysis.ganhos99,
      totalKm: dailyAnalysis.kmRodados,
      totalTime: dailyAnalysis.tempoTrabalhado,
      avgConsumption: carConfig.consumoKmL,
      totalExpenses: dailyAnalysis.gastosTotal,
      expensesByCategory: dailyRecords.find(r => r.date === currentDayString)?.gastos.reduce((acc, expense) => {
        acc[expense.categoria] = (acc[expense.categoria] || 0) + expense.valor;
        return acc;
      }, {} as Record<string, number>) || {}
    } : {
      date: currentDayString,
      totalEarnings: 0,
      uberEarnings: 0,
      nineNineEarnings: 0,
      totalKm: 0,
      totalTime: 0,
      avgConsumption: carConfig.consumoKmL,
      totalExpenses: 0,
      expensesByCategory: {}
    };
  } else {
    weeklyData = getWeeklyAnalysis(currentDayString, dailyRecords, carConfig);
    dailyTotals = {
      date: currentDayString,
      totalEarnings: weeklyData.ganhosBrutos,
      uberEarnings: weeklyData.ganhosUber,
      nineNineEarnings: weeklyData.ganhos99,
      totalKm: weeklyData.kmTotais,
      totalTime: weeklyData.tempoTotalTrabalhado,
      avgConsumption: carConfig.consumoKmL,
      totalExpenses: weeklyData.gastosTotal,
      expensesByCategory: {}
    };
  }

  const getWeeklyEarningsData = () => {
    const weekStartString = getWeekStart(currentDayString);
    const weekData = [];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStartString);
      currentDate.setDate(new Date(weekStartString).getDate() + i);
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
    const expensesByCategory = dailyRecords.find(r => r.date === currentDayString)?.gastos.reduce((acc, expense) => {
      acc[expense.categoria] = (acc[expense.categoria] || 0) + expense.valor;
      return acc;
    }, {} as Record<string, number>) || {};

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];
    
    return Object.entries(expensesByCategory).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    })).filter(item => item.value > 0);
  };
  
  const weeklyEarningsData = getWeeklyEarningsData();
  const expenseData = getExpenseDistributionData();

  const netProfit = dailyTotals.totalEarnings - dailyTotals.totalExpenses;
  const earningsPerHour = dailyTotals.totalTime > 0 ? (dailyTotals.totalEarnings / (dailyTotals.totalTime / 60)) : 0;
  const costPerKm = dailyTotals.totalKm > 0 ? (dailyTotals.totalExpenses / dailyTotals.totalKm) : 0;

  const currentWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  
  const allDaysInWeek = eachDayOfInterval({
    start: currentWeekStart,
    end: currentWeekEnd,
  });

  const selectedWeekDays = allDaysInWeek.filter(day => format(day, "yyyy-MM-dd") !== currentDayString);

  const formatWeekForDisplay = () => {
    const start = format(currentWeekStart, "dd/MM");
    const end = format(currentWeekEnd, "dd/MM");
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
                {viewMode === 'daily' ? format(selectedDate, "PPP", { locale: ptBR }) : formatWeekForDisplay()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(day) => {
                  if (day) {
                    setSelectedDate(day);
                    setIsPopoverOpen(false);
                  }
                }}
                initialFocus
                locale={ptBR}
                modifiers={{
                  selectedWeek: {
                    from: startOfWeek(selectedDate, { weekStartsOn: 1 }),
                    to: endOfWeek(selectedDate, { weekStartsOn: 1 }),
                  },
                }}
                modifiersClassNames={{
                  selectedWeek: "bg-primary text-primary-foreground bg-opacity-80",
                }}
                classNames={{
                  day_selected: "bg-primary text-primary-foreground bg-opacity-100",
                }}
                weekStartsOn={1}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {loading ? (
        <p>Carregando dados...</p>
      ) : (
        <div className="space-y-6">
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
              subtitle={`${(dailyTotals.totalTime / 60).toFixed(1)}h trabalhadas`}
              icon={Clock}
              variant="default"
            />
            
            <StatCard
              title="Custo por KM"
              value={`R$ ${costPerKm.toFixed(2)}`}
              subtitle={`${dailyTotals.totalKm.toFixed(1)} km rodados`}
              icon={Route}
              variant="warning"
            />
            
            <StatCard
              title="Total de Gastos"
              value={`R$ ${dailyTotals.totalExpenses.toFixed(2)}`}
              subtitle={viewMode === 'daily' ? 'Hoje' : 'Esta semana'}
              icon={Car}
              variant="warning"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Evolução dos Ganhos Semanais
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weeklyEarningsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyEarningsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dia" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']}
                        labelFormatter={(label) => `${label}`}
                      />
                      <Bar dataKey="uber" stackId="a" fill="hsl(var(--primary))" name="Uber" />
                      <Bar dataKey="99" stackId="a" fill="hsl(var(--secondary))" name="99" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Distribuição de Gastos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expenseData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expenseData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expenseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Breakdown por Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Uber</span>
                    <div className="text-right">
                      <p className="font-bold text-primary">R$ {dailyTotals.uberEarnings.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {dailyRecords.filter(e => e.ganhosUber > 0).length} dias registrados
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">99</span>
                    <div className="text-right">
                      <p className="font-bold text-secondary">R$ {dailyTotals.nineNineEarnings.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {dailyRecords.filter(e => e.ganhos99 > 0).length} dias registrados
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas de Eficiência</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Consumo Médio</span>
                    <span className="font-bold">{dailyTotals.avgConsumption.toFixed(1)} km/l</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total de Gastos</span>
                    <span className="font-bold text-destructive">R$ {dailyTotals.totalExpenses.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Tempo Total</span>
                    <span className="font-bold">{(dailyTotals.totalTime / 60).toFixed(1)}h</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};