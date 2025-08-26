import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Separator } from "@/components/ui/separator";

interface ExpenseDistributionChartProps {
  expensesByCategory: Record<string, number>;
}

export const ExpenseDistributionChart = ({ expensesByCategory }: ExpenseDistributionChartProps) => {
  const getExpenseDistributionData = () => {
    const colors = [
      'hsl(var(--destructive))',
      'hsl(var(--warning))',
      'hsl(var(--primary))',
      'hsl(var(--graph1))',
      'hsl(var(--graph2))',
      'hsl(var(--graph3))',
      'hsl(var(--info))',
    ];
    const expenseEntries = Object.entries(expensesByCategory).filter(([, value]) => value > 0);

    return expenseEntries.map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  };

  const data = getExpenseDistributionData();
  const totalExpenses = data.reduce((acc, curr) => acc + curr.value, 0);

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
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
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
                  formatter={(value: number, name: string) => [`${name}: R$ ${value.toFixed(2)}`, '']}
                  labelFormatter={() => ''}
                />
              </PieChart>
            </ResponsiveContainer>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <h4 className="font-semibold mb-2">Detalhes dos Gastos:</h4>
              {data.sort((a, b) => b.value - a.value).map((expense) => (
                <div key={expense.name} className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: expense.color }} />
                    {expense.name}
                  </span>
                  <span className="font-medium">
                    R$ {expense.value.toFixed(2)}
                    <span className="text-muted-foreground ml-2 text-xs">
                      ({((expense.value / totalExpenses) * 100).toFixed(1)}%)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum dado de gasto disponível.
          </div>
        )}
      </CardContent>
    </Card>
  );
};