import { useState } from "react";
import { TrendingUp, TrendingDown, Clock, Route, DollarSign, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDriverData } from "@/hooks/useDriverData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const Dashboard = () => {
  const { getDailyAnalysis, getWeeklyAnalysis, dailyRecords } = useDriverData();
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Calculate week start date (Monday)
  const getWeekStart = (date: string) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };

  const dailyData = getDailyAnalysis(selectedDate);
  const weeklyData = getWeeklyAnalysis(getWeekStart(selectedDate));

  // Prepare weekly earnings chart data
  const getWeeklyEarningsData = () => {
    const weekStart = new Date(getWeekStart(selectedDate));
    const weekData = [];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      const dayData = getDailyAnalysis(dateString);
      
      weekData.push({
        dia: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][currentDate.getDay()],
        uber: dayData?.ganhosUber || 0,
        '99': dayData?.ganhos99 || 0,
        total: (dayData?.ganhosUber || 0) + (dayData?.ganhos99 || 0)
      });
    }
    return weekData;
  };

  // Prepare expense distribution chart data
  const getExpenseDistributionData = () => {
    const weekStart = getWeekStart(selectedDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(new Date(weekStart).getDate() + 6);
    
    const weekRecords = dailyRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= new Date(weekStart) && recordDate <= weekEnd;
    });

    const expenseCategories: { [key: string]: number } = {};
    
    weekRecords.forEach(record => {
      record.gastos.forEach(gasto => {
        const category = gasto.categoria;
        expenseCategories[category] = (expenseCategories[category] || 0) + gasto.valor;
      });
    });

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];
    
    return Object.entries(expenseCategories).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  };

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
      <Card className={`${variantClasses[variant]} transition-colors`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${iconClasses[variant]}`} />
              <span className="text-sm font-medium text-muted-foreground">{title}</span>
            </div>
            {trend && (
              <div className={`flex items-center ${trend === 'up' ? 'text-success' : 'text-destructive'}`}>
                {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">{value}</div>
            {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 pb-20 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Acompanhe seus ganhos e performance</p>
      </div>

      {/* Toggle View Mode */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={viewMode === 'daily' ? 'default' : 'outline'}
          onClick={() => setViewMode('daily')}
        >
          Visão Diária
        </Button>
        <Button
          variant={viewMode === 'weekly' ? 'default' : 'outline'}
          onClick={() => setViewMode('weekly')}
        >
          Visão Semanal
        </Button>
      </div>

      {/* Date Selection */}
      <div className="mb-6">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Weekly Earnings Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução dos Ganhos Semanais</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyEarningsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']} />
                <Bar dataKey="uber" fill="hsl(var(--primary))" name="Uber" />
                <Bar dataKey="99" fill="hsl(var(--secondary))" name="99" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Gastos</CardTitle>
          </CardHeader>
          <CardContent>
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
                <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Valor']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily View */}
      {viewMode === 'daily' && (
        <div className="space-y-6">
          {dailyData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Ganhos Uber"
                  value={`R$ ${dailyData.ganhosUber.toFixed(2)}`}
                  icon={DollarSign}
                  variant="success"
                />
                <StatCard
                  title="Ganhos 99"
                  value={`R$ ${dailyData.ganhos99.toFixed(2)}`}
                  icon={DollarSign}
                  variant="success"
                />
                <StatCard
                  title="Total Bruto"
                  value={`R$ ${dailyData.ganhosBrutos.toFixed(2)}`}
                  icon={DollarSign}
                  variant="success"
                  trend="up"
                />
                <StatCard
                  title="Gastos Total"
                  value={`R$ ${dailyData.gastosTotal.toFixed(2)}`}
                  icon={TrendingDown}
                  variant="destructive"
                />
                <StatCard
                  title="Lucro Líquido"
                  value={`R$ ${dailyData.lucroLiquido.toFixed(2)}`}
                  subtitle={dailyData.lucroLiquido > 0 ? "Lucro" : "Prejuízo"}
                  icon={TrendingUp}
                  variant={dailyData.lucroLiquido > 0 ? "success" : "destructive"}
                />
                <StatCard
                  title="Ganho por Hora"
                  value={`R$ ${dailyData.ganhoPorHora.toFixed(2)}`}
                  subtitle={`${Math.floor(dailyData.tempoTrabalhado / 60)}h ${dailyData.tempoTrabalhado % 60}min trabalhados`}
                  icon={Clock}
                />
                <StatCard
                  title="Corridas"
                  value={dailyData.numCorridas.toString()}
                  subtitle={`${dailyData.kmRodados.toFixed(1)} km rodados`}
                  icon={Route}
                />
                <StatCard
                  title="Ganho por Minuto"
                  value={`R$ ${dailyData.ganhoPorMinuto.toFixed(2)}`}
                  icon={Clock}
                />
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Nenhum registro encontrado para esta data.</p>
                <p className="text-sm text-muted-foreground mt-2">Vá para a aba "Registrar" para adicionar dados.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Weekly View */}
      {viewMode === 'weekly' && (
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground mb-4">
            Semana de {weeklyData.periodoSemana.inicio} a {weeklyData.periodoSemana.fim}
          </div>
          
          {/* Análise Comparativa por Plataforma */}
          <Card>
            <CardHeader>
              <CardTitle>Análise Comparativa Semanal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-primary">Uber</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Ganhos:</span>
                      <span className="font-medium">R$ {weeklyData.ganhosUber.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Ganho/hora:</span>
                      <span className="font-medium">R$ {weeklyData.ganhoPorHoraUber.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-primary">99</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Ganhos:</span>
                      <span className="font-medium">R$ {weeklyData.ganhos99.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Ganho/hora:</span>
                      <span className="font-medium">R$ {weeklyData.ganhoPorHora99.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Plataforma mais rentável: <span className="font-medium text-foreground">
                    {weeklyData.ganhoPorHoraUber > weeklyData.ganhoPorHora99 ? 'Uber' : 
                     weeklyData.ganhoPorHora99 > weeklyData.ganhoPorHoraUber ? '99' : 'Empate'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Total Bruto Semanal"
              value={`R$ ${weeklyData.ganhosBrutos.toFixed(2)}`}
              subtitle={`Uber: R$ ${weeklyData.ganhosUber.toFixed(2)} | 99: R$ ${weeklyData.ganhos99.toFixed(2)}`}
              icon={DollarSign}
              variant="success"
            />
            <StatCard
              title="Gastos Registrados"
              value={`R$ ${weeklyData.gastosRegistrados.toFixed(2)}`}
              icon={TrendingDown}
              variant="destructive"
            />
            <StatCard
              title="Aluguel Semanal"
              value={`R$ ${weeklyData.aluguelSemanal.toFixed(2)}`}
              icon={DollarSign}
              variant="warning"
            />
            <StatCard
              title="Lucro Líquido Semanal"
              value={`R$ ${weeklyData.lucroLiquido.toFixed(2)}`}
              subtitle={weeklyData.lucroLiquido > 0 ? "Lucro" : "Prejuízo"}
              icon={TrendingUp}
              variant={weeklyData.lucroLiquido > 0 ? "success" : "destructive"}
            />
            <StatCard
              title="KM Rodados"
              value={`${weeklyData.kmTotais.toFixed(1)} km`}
              subtitle={`Limite: ${weeklyData.limiteKm} km`}
              icon={Route}
              variant={weeklyData.kmExcedidos > 0 ? "warning" : "default"}
            />
            {weeklyData.kmExcedidos > 0 && (
              <StatCard
                title="KM Excedidos"
                value={`${weeklyData.kmExcedidos.toFixed(1)} km`}
                subtitle={`Custo: R$ ${weeklyData.custoKmExcedido.toFixed(2)}`}
                icon={AlertTriangle}
                variant="warning"
              />
            )}
          </div>

          {weeklyData.kmExcedidos > 0 && (
            <Card className="border-warning/20 bg-warning/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  Atenção: Limite de KM Excedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Você excedeu o limite semanal em {weeklyData.kmExcedidos.toFixed(1)} km, 
                  gerando um custo adicional de R$ {weeklyData.custoKmExcedido.toFixed(2)}.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};