import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PerformanceAnalysis } from "./dashboard-helpers";

interface MetricTabsCardProps {
  metrics: PerformanceAnalysis;
}

// Componente auxiliar para exibir uma linha de métrica
const MetricRow = ({ title, faturamento, custo, lucro }: { title: string, faturamento: number, custo: number, lucro: number }) => (
  <div>
    <h4 className="text-sm font-semibold uppercase text-muted-foreground mb-2">{title}</h4>
    <div className="grid grid-cols-3 gap-2 text-center">
      <div>
        <p className="text-lg font-bold">R$ {faturamento.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground">Faturamento</p>
      </div>
      <div>
        <p className="text-lg font-bold text-destructive">R$ {custo.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground">Custo</p>
      </div>
      <div>
        <p className="text-lg font-bold text-success">R$ {lucro.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground">Lucro</p>
      </div>
    </div>
  </div>
);

// Certifique-se de que a exportação está exatamente assim
export const MetricTabsCard = ({ metrics }: MetricTabsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise por Unidade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <MetricRow
          title="Por Hora"
          faturamento={metrics.faturamentoPorHora}
          custo={metrics.custoPorHora}
          lucro={metrics.lucroPorHora}
        />
        <Separator />
        <MetricRow
          title="Por KM"
          faturamento={metrics.faturamentoPorKm}
          custo={metrics.custoPorKm}
          lucro={metrics.lucroPorKm}
        />
        <Separator />
        <MetricRow
          title="Por Viagem"
          faturamento={metrics.faturamentoPorViagem}
          custo={metrics.custoPorViagem}
          lucro={metrics.lucroPorViagem}
        />
      </CardContent>
    </Card>
  );
};