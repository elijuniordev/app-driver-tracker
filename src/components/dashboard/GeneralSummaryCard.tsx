import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Clock, Route } from "lucide-react";

interface GeneralSummaryCardProps {
  totalViagens: number;
  horasTrabalhadas: number;
  kmsRodados: number;
}

export const GeneralSummaryCard = ({ totalViagens, horasTrabalhadas, kmsRodados }: GeneralSummaryCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo Geral</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4 text-center">
        <div>
          <Briefcase className="h-8 w-8 mx-auto text-primary" />
          <p className="text-2xl font-bold mt-2">{totalViagens}</p>
          <p className="text-xs text-muted-foreground">Viagens</p>
        </div>
        <div>
          <Clock className="h-8 w-8 mx-auto text-primary" />
          <p className="text-2xl font-bold mt-2">{(horasTrabalhadas / 60).toFixed(1)}h</p>
          <p className="text-xs text-muted-foreground">Horas</p>
        </div>
        <div>
          <Route className="h-8 w-8 mx-auto text-primary" />
          <p className="text-2xl font-bold mt-2">{kmsRodados.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">KM Rodados</p>
        </div>
      </CardContent>
    </Card>
  );
};