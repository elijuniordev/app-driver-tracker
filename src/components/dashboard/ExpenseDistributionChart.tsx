import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface ExpenseDistributionChartProps {
  expensesByCategory: Record<string, number>;
}

export const ExpenseDistributionChart = ({ expensesByCategory }: ExpenseDistributionChartProps) => {
  const getExpenseDistributionData = () => {
    const colors = [
      'hsl(var(--graph1))',
      'hsl(var(--graph2))',
      'hsl(var(--graph3))',
      'hsl(var(--graph4))',
      'hsl(var(--graph5))',
      'hsl(var(--primary))', 
      'hsl(var(--secondary))', 
      'hsl(var(--warning))', 
      'hsl(var(--destructive))', 
      'hsl(var(--info))',
    ];
    const expenseEntries = Object.entries(expensesByCategory).filter(([name, value]) => value > 0);

    return expenseEntries.map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  };

  const data = getExpenseDistributionData();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Distribuição de Gastos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']} 
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum dado disponível
          </div>
        )}
      </CardContent>
    </Card>
  );
};