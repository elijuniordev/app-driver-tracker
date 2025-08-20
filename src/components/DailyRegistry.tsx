import { useState, useEffect } from "react";
import { Calendar, Clock, Route, DollarSign, Plus, Trash2, Fuel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DailyRecord, Expense, CarConfig } from "@/hooks/useDriverData";

interface DailyRegistryProps {
  onSave: (record: Omit<DailyRecord, 'id'>) => void;
  carConfig: CarConfig;
}

const expenseCategories = [
  'Combustível',
  'Manutenção',
  'Limpeza',
  'Almoço',
  'Pedágio',
  'Estacionamento',
  'Outros'
];

export const DailyRegistry = ({ onSave, carConfig }: DailyRegistryProps) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    tempoTrabalhado: { horas: 0, minutos: 0 },
    numCorridas: 0,
    kmRodados: 0,
    valorBruto: 0,
  });

  const [gastos, setGastos] = useState<Expense[]>([]);
  const [novoGasto, setNovoGasto] = useState({ valor: 0, categoria: '' });
  const [combustivelCalculado, setCombustivelCalculado] = useState<number>(0);
  const { toast } = useToast();

  // Calcular combustível automaticamente quando KM ou configuração mudar
  useEffect(() => {
    if (formData.kmRodados > 0 && carConfig.eficienciaKmL > 0 && carConfig.precoCombustivel > 0) {
      const litrosConsumidos = formData.kmRodados / carConfig.eficienciaKmL;
      const valorCombustivel = litrosConsumidos * carConfig.precoCombustivel;
      setCombustivelCalculado(valorCombustivel);
    } else {
      setCombustivelCalculado(0);
    }
  }, [formData.kmRodados, carConfig.eficienciaKmL, carConfig.precoCombustivel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tempoTotalMinutos = formData.tempoTrabalhado.horas * 60 + formData.tempoTrabalhado.minutos;
    
    // Adicionar combustível calculado automaticamente aos gastos
    const gastosComCombustivel = [...gastos];
    if (combustivelCalculado > 0) {
      // Verificar se já existe um gasto de combustível adicionado manualmente
      const combustivelExistente = gastos.find(g => g.categoria === 'Combustível');
      if (!combustivelExistente) {
        gastosComCombustivel.push({
          id: `combustivel-${Date.now()}`,
          valor: combustivelCalculado,
          categoria: 'Combustível (Auto)',
        });
      }
    }
    
    const record: Omit<DailyRecord, 'id'> = {
      date: formData.date,
      tempoTrabalhado: tempoTotalMinutos,
      numCorridas: formData.numCorridas,
      kmRodados: formData.kmRodados,
      valorBruto: formData.valorBruto,
      gastos: gastosComCombustivel,
    };

    onSave(record);
    
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      tempoTrabalhado: { horas: 0, minutos: 0 },
      numCorridas: 0,
      kmRodados: 0,
      valorBruto: 0,
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
        id: Date.now().toString(),
        valor: novoGasto.valor,
        categoria: novoGasto.categoria,
      };
      setGastos([...gastos, gasto]);
      setNovoGasto({ valor: 0, categoria: '' });
    }
  };

  const removerGasto = (id: string) => {
    setGastos(gastos.filter(g => g.id !== id));
  };

  const totalGastos = gastos.reduce((sum, gasto) => sum + gasto.valor, 0);
  const totalComCombustivel = totalGastos + (combustivelCalculado > 0 && !gastos.find(g => g.categoria === 'Combustível') ? combustivelCalculado : 0);

  return (
    <div className="p-4 pb-20 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Registro Diário</h1>
        <p className="text-muted-foreground">Registre seus ganhos e gastos do dia</p>
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

        {/* Corridas e KM */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-primary" />
              Corridas e Quilometragem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="corridas">Número de Corridas</Label>
                <Input
                  id="corridas"
                  type="number"
                  min="0"
                  value={formData.numCorridas || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, numCorridas: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="km">KM Rodados</Label>
                <Input
                  id="km"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.kmRodados || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, kmRodados: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor-bruto">Valor Bruto Total (R$)</Label>
              <Input
                id="valor-bruto"
                type="number"
                min="0"
                step="0.01"
                value={formData.valorBruto || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, valorBruto: parseFloat(e.target.value) || 0 }))}
              />
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
                  {formData.kmRodados > 0 && carConfig.eficienciaKmL > 0 && (
                    <>
                      {formData.kmRodados} km ÷ {carConfig.eficienciaKmL} km/L = {(formData.kmRodados / carConfig.eficienciaKmL).toFixed(2)} litros<br />
                      {(formData.kmRodados / carConfig.eficienciaKmL).toFixed(2)} litros × R$ {carConfig.precoCombustivel.toFixed(2)}/L
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