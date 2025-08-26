import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaUber } from "react-icons/fa";
import { TbNumber99Small } from "react-icons/tb";
import { DailyRecord } from "@/hooks/useDriverData";

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
            <FaUber className="h-10 w-10 text-foreground dark:text-white mb-2" />
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
            <TbNumber99Small className="h-10 w-10 text-[#c9a102] mb-2" /> {/* Cor amarela vibrante para o ícone */}
            <span className="font-bold text-lg text-foreground mb-1">99</span> {/* Usando a cor secondary do seu tema */}
            <p className="font-extrabold text-2xl text-[#c9a102]">R$ {ganhos99.toFixed(2)}</p>
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