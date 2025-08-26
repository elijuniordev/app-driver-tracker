import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Gauge } from "lucide-react";

interface MileageControlCardProps {
  currentKm: number;
  limitKm: number;
}

export const MileageControlCard = ({ currentKm, limitKm }: MileageControlCardProps) => {
  const progress = limitKm > 0 ? (currentKm / limitKm) * 100 : 0;
  const remainingKm = limitKm - currentKm;
  const isOverLimit = remainingKm < 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" />
          Controle de KM Semanal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Progress value={progress} />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Rodados: {currentKm.toFixed(1)} km</span>
            <span className="font-medium">Limite: {limitKm} km</span>
          </div>
          <p className={`text-xs text-center ${isOverLimit ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
            {isOverLimit
              ? `${Math.abs(remainingKm).toFixed(1)} km acima do limite!`
              : `${remainingKm.toFixed(1)} km restantes.`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};