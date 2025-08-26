import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";

interface KeyMetricsCardProps {
  lucroLiquido: number;
  ganhosBrutos: number;
  gastosTotal: number;
}

export const KeyMetricsCard = ({ lucroLiquido, ganhosBrutos, gastosTotal }: KeyMetricsCardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Lucro Líquido</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-900 dark:text-green-100">R$ {lucroLiquido.toFixed(2)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" /> Faturamento Bruto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">R$ {ganhosBrutos.toFixed(2)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" /> Gastos Totais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">R$ {gastosTotal.toFixed(2)}</p>
        </CardContent>
      </Card>
    </div>
  );
};