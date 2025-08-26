import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";

interface GoalProgressCardProps {
  currentEarnings: number;
  goal: number;
  viewMode: 'weekly' | 'monthly';
}

export const GoalProgressCard = ({ currentEarnings, goal, viewMode }: GoalProgressCardProps) => {
  const progress = goal > 0 ? (currentEarnings / goal) * 100 : 0;
  const remaining = goal - currentEarnings;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Meta {viewMode === 'weekly' ? 'Semanal' : 'Mensal'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Alcançado: R$ {currentEarnings.toFixed(2)}</span>
            <span className="font-medium">Meta: R$ {goal.toFixed(2)}</span>
          </div>
          {remaining > 0 ? (
            <p className="text-xs text-center text-muted-foreground">Faltam R$ {remaining.toFixed(2)} para atingir sua meta.</p>
          ) : (
            <p className="text-xs text-center font-bold text-success">Meta atingida! 🎉</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};