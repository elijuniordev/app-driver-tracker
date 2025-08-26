import { useState, useEffect } from "react";
import { Calendar, Clock, Route, DollarSign, Plus, Trash2, Fuel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DailyRecord, Expense, CarConfig } from "@/hooks/useDriverData";
import { getLocalISODate } from "@/lib/utils";

interface DailyRegistryProps {
  onSave: (record: Omit<DailyRecord, 'id'>) => void;
  carConfig: CarConfig;
}

const expenseCategories = [
  'Combustível',
  'Limpeza',
  'Almoço',
  'Pedágio',
  'Estacionamento',
  'Outros'
];

export const DailyRegistry = ({ onSave, carConfig }: DailyRegistryProps) => {
  const [formData, setFormData] = useState({
    date: getLocalISODate(),
    tempoTrabalhado: { horas: 0, minutos: 0 },
    // Dados Uber
    numeroCorridasUber: 0,
    kmRodadosUber: 0,
    ganhosUber: 0,
    // Dados 99
    numeroCorridas99: 0,
    kmRodados99: 0,
    ganhos99: 0,
  });

  const [gastos, setGastos] = useState<Expense[]>([]);
  const [novoGasto, setNovoGasto] = useState({ valor: 0, categoria: '' });
  const [combustivelCalculado, setCombustivelCalculado] = useState<number>(0);
  const { toast } = useToast();

  // Calcular combustível automaticamente quando KM e configurações do carro mudam
  useEffect(() => {
    const totalKm = formData.kmRodadosUber + formData.kmRodados99;
    if (totalKm > 0 && carConfig.consumoKmL > 0 && carConfig.precoCombustivel > 0) {
      const litrosConsumidos = totalKm / carConfig.consumoKmL;
      const valorCombustivel = litrosConsumidos * carConfig.precoCombustivel;
      setCombustivelCalculado(valorCombustivel);
    } else {
      setCombustivelCalculado(0);
    }
  }, [formData.kmRodadosUber, formData.kmRodados99, carConfig.consumoKmL, carConfig.precoCombustivel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tempoTotalMinutos = formData.tempoTrabalhado.horas * 60 + formData.tempoTrabalhado.minutos;
    
    const gastosComCombustivel = [...gastos];
    const combustivelManual = gastos.find(g => g.categoria === 'Combustível');
    
    // Adicionar o gasto de combustível calculado somente se não houver um gasto manual
    if (combustivelCalculado > 0 && !combustivelManual) {
      gastosComCombustivel.push({
        id: Date.now(),
        valor: combustivelCalculado,
        categoria: 'Combustível (Auto)',
      });
    }
    
    const record: Omit<DailyRecord, 'id'> = {
      date: formData.date,
      tempoTrabalhado: tempoTotalMinutos,
      numeroCorridasUber: formData.numeroCorridasUber,
      kmRodadosUber: formData.kmRodadosUber,
      numeroCorridas99: formData.numeroCorridas99,
      kmRodados99: formData.kmRodados99,
      ganhosUber: formData.ganhosUber,
      ganhos99: formData.ganhos99,
      gastos: gastosComCombustivel,
    };

    onSave(record);
    
    // Reset form
    setFormData({
      date: getLocalISODate(),
      tempoTrabalhado: { horas: 0, minutos: 0 },
      numeroCorridasUber: 0,
      kmRodadosUber: 0,
      ganhosUber: 0,
      numeroCorridas99: 0,
      kmRodados99: 0,
      ganhos99: 0,
    });
    setGastos([]);
    
    toast({
      title: "Registro salvo!",
      description: "Seus dados do dia foram salvos com sucesso.",
    });
  };

  const adicionarGasto = () => {
    if (novoGasto.valor > 0 && novoGasto.categoria) {
      const gasto: Expense = {
        id: Date.now(),
        valor: novoGasto.valor,
        categoria: novoGasto.categoria,
      };
      setGastos([...gastos, gasto]);
      setNovoGasto({ valor: 0, categoria: '' });
    }
  };

  const removerGasto = (id: number) => {
    setGastos(gastos.filter(g => g.id !== id));
  };

  const totalGastos = gastos.reduce((sum, gasto) => sum + gasto.valor, 0);
  const totalComCombustivel = totalGastos + (combustivelCalculado > 0 && !gastos.find(g => g.categoria === 'Combustível') ? combustivelCalculado : 0);
  const totalKm = formData.kmRodadosUber + formData.kmRodados99;

  return (
    <div className="p-4 pb-20 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Registro do Dia</h1>
        <p className="text-muted-foreground">Registre todos os dados do seu trabalho ao final do dia</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Data e Tempo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Data e Tempo Trabalhado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="horas">Horas Trabalhadas</Label>
                <Input
                  id="horas"
                  type="number"
                  min="0"
                  max="24"
                  value={formData.tempoTrabalhado.horas || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    tempoTrabalhado: { ...prev.tempoTrabalhado, horas: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minutos">Minutos</Label>
                <Input
                  id="minutos"
                  type="number"
                  min="0"
                  max="59"
                  value={formData.tempoTrabalhado.minutos || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    tempoTrabalhado: { ...prev.tempoTrabalhado, minutos: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados Uber */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-primary" />
              Dados Uber
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="corridas-uber">Número de Corridas</Label>
                <Input
                  id="corridas-uber"
                  type="number"
                  min="0"
                  value={formData.numeroCorridasUber || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, numeroCorridasUber: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="km-uber">KM Rodados</Label>
                <Input
                  id="km-uber"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.kmRodadosUber || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, kmRodadosUber: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ganhos-uber">Ganhos (R$)</Label>
                <Input
                  id="ganhos-uber"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.ganhosUber || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, ganhosUber: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados 99 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-secondary" />
              Dados 99
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="corridas-99">Número de Corridas</Label>
                <Input
                  id="corridas-99"
                  type="number"
                  min="0"
                  value={formData.numeroCorridas99 || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, numeroCorridas99: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="km-99">KM Rodados</Label>
                <Input
                  id="km-99"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.kmRodados99 || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, kmRodados99: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ganhos-99">Ganhos (R$)</Label>
                <Input
                  id="ganhos-99"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.ganhos99 || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, ganhos99: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gastos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-destructive" />
              Gastos do Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Combustível calculado automaticamente */}
            {combustivelCalculado > 0 && (
              <div className="bg-success-light border border-success/20 p-3 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Fuel className="h-4 w-4 text-success" />
                  <span className="font-medium text-success">Combustível Calculado Automaticamente</span>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  {totalKm > 0 && carConfig.consumoKmL > 0 && (
                    <>
                      {totalKm} km ÷ {carConfig.consumoKmL} km/L = {(totalKm / carConfig.consumoKmL).toFixed(2)} litros<br />
                      {(totalKm / carConfig.consumoKmL).toFixed(2)} litros × R$ {carConfig.precoCombustivel.toFixed(2)}/L
                    </>
                  )}
                </div>
                <div className="font-medium text-success">R$ {combustivelCalculado.toFixed(2)}</div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Valor (R$)"
                value={novoGasto.valor || ''}
                onChange={(e) => setNovoGasto(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
              />
              <Select value={novoGasto.categoria} onValueChange={(value) => setNovoGasto(prev => ({ ...prev, categoria: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={adicionarGasto} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {gastos.length > 0 && (
              <div className="space-y-2">
                {gastos.map(gasto => (
                  <div key={gasto.id} className="flex items-center justify-between bg-muted p-3 rounded-md">
                    <div>
                      <span className="font-medium">{gasto.categoria}</span>
                      <span className="text-muted-foreground ml-2">R$ {gasto.valor.toFixed(2)}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removerGasto(gasto.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="text-right space-y-1">
                  <div className="text-muted-foreground">Gastos manuais: R$ {totalGastos.toFixed(2)}</div>
                  {combustivelCalculado > 0 && !gastos.find(g => g.categoria === 'Combustível') && (
                    <div className="text-muted-foreground">Combustível (auto): R$ {combustivelCalculado.toFixed(2)}</div>
                  )}
                  <div className="font-medium border-t pt-1">
                    Total de gastos: R$ {totalComCombustivel.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">
          Salvar Registro do Dia
        </Button>
      </form>
    </div>
  );
};