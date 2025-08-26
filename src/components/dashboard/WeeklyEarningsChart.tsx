import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DailyRecord, CarConfig } from "@/hooks/useDriverData";
import { getDailyAnalysis, getWeekStart } from "./dashboard-helpers";
import { createLocalDate } from "@/lib/utils";

interface WeeklyEarningsChartProps {
  currentDayString: string;
  dailyRecords: DailyRecord[];
  carConfig: CarConfig;
}

export const WeeklyEarningsChart = ({ currentDayString, dailyRecords, carConfig }: WeeklyEarningsChartProps) => {
  const getWeeklyChartData = () => {
    const weekStart = createLocalDate(getWeekStart(currentDayString));
    const weekData = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(weekStart, i);
      const dateString = format(currentDate, "yyyy-MM-dd");
      const dayData = getDailyAnalysis(dateString, dailyRecords, carConfig);

      weekData.push({
        dia: format(currentDate, "E", { locale: ptBR }),
        'Ganhos Uber': dayData?.ganhosUber || 0,
        'Ganhos 99': dayData?.ganhos99 || 0,
        'Ganhos Extras': dayData?.ganhosExtras || 0,
        'Gastos': dayData?.gastosTotal || 0,
      });
    }
    return weekData;
  };

  const data = getWeeklyChartData();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Resumo Financeiro da Semana
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="dia" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
              <Tooltip
                cursor={{ fill: "hsl(var(--accent))", opacity: 0.3 }}
                contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "0.5rem" }}
                formatter={(value: number, name: string) => [`R$ ${value.toFixed(2)}`, name]}
              />
              <Legend />
              <Bar dataKey="Ganhos Uber" stackId="ganhos" fill="#000000" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Ganhos 99" stackId="ganhos" fill="#ffa916" />
              <Bar dataKey="Ganhos Extras" stackId="ganhos" fill="#00b837" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">Nenhum dado disponível</div>
        )}
      </CardContent>
    </Card>
  );
};