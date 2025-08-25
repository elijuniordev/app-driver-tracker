import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Clock, Route, DollarSign, AlertTriangle, Car } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DailyEntry {
  id: number;
  data: string;
  ganhos_uber: number;
  ganhos_99: number;
  km_rodados: number;
  tempo_trabalhado: number;
  consumo_km_l: number;
}

interface Expense {
  id: number;
  data: string;
  categoria: string;
  valor: number;
}

interface DailyTotals {
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

export const EnhancedDashboard = () => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculate week start date (Monday)
  const getWeekStart = (date: string) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };

  const fetchData = async (startDate: string, endDate: string) => {
    try {
      setLoading(true);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      // Fetch daily entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('entradas_diarias')
        .select('*')
        .eq('user_id', user.id)
        .gte('data', startDate)
        .lte('data', endDate)
        .order('data', { ascending: true });

      if (entriesError) throw entriesError;

      // Fetch expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('gastos_avulsos')
        .select('*')
        .eq('user_id', user.id)
        .gte('data', startDate)
        .lte('data', endDate)
        .order('data', { ascending: true });

      if (expensesError) throw expensesError;

      setDailyEntries(entriesData || []);
      setExpenses(expensesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'daily') {
      fetchData(selectedDate, selectedDate);
    } else {
      const weekStart = getWeekStart(selectedDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(new Date(weekStart).getDate() + 6);
      fetchData(weekStart, weekEnd.toISOString().split('T')[0]);
    }
  }, [selectedDate, viewMode]);

  const calculateDailyTotals = (): DailyTotals => {
    const uberEarnings = dailyEntries.reduce((sum, entry) => sum + entry.ganhos_uber, 0);
    const nineNineEarnings = dailyEntries.reduce((sum, entry) => sum + entry.ganhos_99, 0);
    const totalEarnings = uberEarnings + nineNineEarnings;
    const totalKm = dailyEntries.reduce((sum, entry) => sum + entry.km_rodados, 0);
    const totalTime = dailyEntries.reduce((sum, entry) => sum + entry.tempo_trabalhado, 0);
    const avgConsumption = dailyEntries.length > 0 
      ? dailyEntries.reduce((sum, entry) => sum + entry.consumo_km_l, 0) / dailyEntries.length 
      : 0;
    
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.valor, 0);
    const expensesByCategory = expenses.reduce((acc, expense) => {
      acc[expense.categoria] = (acc[expense.categoria] || 0) + expense.valor;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      date: selectedDate,
      totalEarnings,
      uberEarnings,
      nineNineEarnings,
      totalKm,
      totalTime,
      avgConsumption,
      totalExpenses,
      expensesByCategory
    };
  };

  // Prepare weekly earnings chart data
  const getWeeklyEarningsData = () => {
    const weekStart = new Date(getWeekStart(selectedDate));
    const weekData = [];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      
      const dayEntry = dailyEntries.find(entry => entry.data === dateString);
      
      const uberTotal = dayEntry?.ganhos_uber || 0;
      const nineNineTotal = dayEntry?.ganhos_99 || 0;
      
      weekData.push({
        dia: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][currentDate.getDay()],
        uber: uberTotal,
        '99': nineNineTotal,
        total: uberTotal + nineNineTotal
      });
    }
    return weekData;
  };

  // Prepare expense distribution chart data
  const getExpenseDistributionData = () => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];
    
    return Object.entries(dailyTotals.expensesByCategory).map(([category, value], index) => ({
      name: category,
      value,
      color: colors[index % colors.length]
    })).filter(item => item.value > 0);
  };

  const dailyTotals = calculateDailyTotals();
  const weeklyEarningsData = getWeeklyEarningsData();
  const expenseData = getExpenseDistributionData();

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    variant = 'default' 
  }: {
    title: string;
    value: string;
    subtitle?: string;
    icon: any;
    trend?: 'up' | 'down';
    variant?: 'default' | 'success' | 'warning' | 'destructive';
  }) => {
    const variantClasses = {
      default: 'border-border',
      success: 'border-success/20 bg-success/5',
      warning: 'border-warning/20 bg-warning/5',
      destructive: 'border-destructive/20 bg-destructive/5',
    };

    const iconClasses = {
      default: 'text-primary',
      success: 'text-success',
      warning: 'text-warning',
      destructive: 'text-destructive',
    };

    return (
      <Card className={`${variantClasses[variant]} transition-all hover:shadow-md`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Icon className={`h-6 w-6 ${iconClasses[variant]}`} />
              {trend && (
                <div className="flex items-center gap-1">
                  {trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-success" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-destructive" />
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const netProfit = dailyTotals.totalEarnings - dailyTotals.totalExpenses;
  const earningsPerHour = dailyTotals.totalTime > 0 ? (dailyTotals.totalEarnings / (dailyTotals.totalTime / 60)) : 0;
  const costPerKm = dailyTotals.totalKm > 0 ? (dailyTotals.totalExpenses / dailyTotals.totalKm) : 0;

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
          
          <div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
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
          subtitle={`${expenses.length} registros`}
          icon={Car}
          variant="warning"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Earnings Chart */}
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

        {/* Expense Distribution Chart */}
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

      {/* Platform Breakdown */}
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
                    {dailyEntries.filter(e => e.ganhos_uber > 0).length} dias registrados
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">99</span>
                <div className="text-right">
                  <p className="font-bold text-secondary">R$ {dailyTotals.nineNineEarnings.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    {dailyEntries.filter(e => e.ganhos_99 > 0).length} dias registrados
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
  );
};