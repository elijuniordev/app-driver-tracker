import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DailyRecord, CarConfig } from "@/hooks/useDriverData";
import { getDailyAnalysis, getWeekStart } from "./dashboard-helpers";

interface WeeklyEarningsChartProps {
  currentDayString: string;
  dailyRecords: DailyRecord[];
  carConfig: CarConfig;
}

export const WeeklyEarningsChart = ({
  currentDayString,
  dailyRecords,
  carConfig,
}: WeeklyEarningsChartProps) => {
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
        "99": dayData?.ganhos99 || 0,
        gastos: dayData?.gastosTotal || 0, // <<<---- CORREÇÃO AQUI
      });
    }
    return weekData;
  };

  const data = getWeeklyEarningsData();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Evolução dos Ganhos Semanais
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="dia" className="fill-foreground" />
              <YAxis className="fill-foreground" />
              <Tooltip
                cursor={{ fill: "hsl(var(--accent))", opacity: 0.3 }}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                formatter={(value: number, name: string) => [
                  `R$ ${value.toFixed(2)}`,
                  name,
                ]}
                labelFormatter={(label) => `${label}`}
              />
              <Legend />
              {/* Uber - Cor alterada para preto */}
              <Bar
                dataKey="uber"
                fill="#000000" // Cor preta
                name="Ganhos Uber"
                radius={[4, 4, 0, 0]}
              />
              {/* 99 */}
              <Bar
                dataKey="99"
                fill="#ffa916"
                name="Ganhos 99"
                radius={[4, 4, 0, 0]}
              />
              {/* Gastos */}
              <Bar
                dataKey="gastos"
                fill="#ff0000"
                name="Gastos"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
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