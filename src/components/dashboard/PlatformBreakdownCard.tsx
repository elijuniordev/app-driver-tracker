import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyRecord } from "@/hooks/useDriverData";

// Importe os arquivos SVG como caminhos de URL
import UberLogoUrl from "/logos/uber-app.svg";
import NinetyNineLogoUrl from "/logos/99-app.svg";

interface PlatformBreakdownCardProps {
  ganhosUber: number;
  ganhos99: number;
  dailyRecords: DailyRecord[];
}

export const PlatformBreakdownCard = ({ ganhosUber, ganhos99, dailyRecords }: PlatformBreakdownCardProps) => {
  const uberDays = dailyRecords.filter(e => e.ganhosUber > 0).length;
  const nineNineDays = dailyRecords.filter(e => e.ganhos99 > 0).length;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ganhos por Plataforma</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-around items-start">
          {/* Seção Uber */}
          <div className="flex flex-col items-center text-center p-4">
            <img src={UberLogoUrl} alt="Uber Logo" className="h-10 w-10 mb-2" />
            <span className="font-bold text-lg text-foreground mb-1">Uber</span>
            <p className="font-extrabold text-2xl text-primary">R$ {ganhosUber.toFixed(2)}</p>
            {uberDays > 0 && (
              <p className="text-sm text-muted-foreground">
                {uberDays} dias registrado{uberDays > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Seção 99 */}
          <div className="flex flex-col items-center text-center p-4">
            <img src={NinetyNineLogoUrl} alt="99 Logo" className="h-10 w-10 mb-2" />
            <span className="font-bold text-lg text-foreground mb-1">99</span>
            <p className="font-extrabold text-2xl text-primary">R$ {ganhos99.toFixed(2)}</p>
            {nineNineDays > 0 && (
              <p className="text-sm text-muted-foreground">
                {nineNineDays} dias registrado{nineNineDays > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};