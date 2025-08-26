import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EfficiencyMetricsCardProps {
  consumoKmL: number;
  totalExpenses: number;
  totalTimeInHours: number;
}

export const EfficiencyMetricsCard = ({ consumoKmL, totalExpenses, totalTimeInHours }: EfficiencyMetricsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Métricas de Eficiência</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Consumo Médio</span>
            <span className="font-bold">{consumoKmL.toFixed(1)} km/l</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Total de Gastos</span>
            <span className="font-bold text-destructive">R$ {totalExpenses.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Tempo Total</span>
            <span className="font-bold">{totalTimeInHours.toFixed(1)}h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};