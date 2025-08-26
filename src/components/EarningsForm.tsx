import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DailyRecord } from "@/hooks/useDriverData";
import { getLocalISODate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Loader2 } from "lucide-react";

// Correção: Omitindo também ganhosExtras do tipo
type EarningsData = Omit<DailyRecord, 'id' | 'gastos' | 'ganhosExtras'>;

interface EarningsFormProps {
  onSave: (data: EarningsData) => void;
  onCancel: () => void;
  loading: boolean;
}

export const EarningsForm = ({ onSave, onCancel, loading }: EarningsFormProps) => {
  const [time, setTime] = useState({ horas: '', minutos: ''});

  const [formData, setFormData] = useState({
    date: getLocalISODate(),
    numeroCorridasUber: 0,
    kmRodadosUber: 0,
    ganhosUber: 0,
    numeroCorridas99: 0,
    kmRodados99: 0,
    ganhos99: 0,
    precoCombustivel: 0,
    consumoKmL: 0,
  });

  const handleChange = (field: keyof Omit<typeof formData, 'date'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const horasEmMinutos = (parseInt(time.horas) || 0) * 60;
    const minutos = parseInt(time.minutos) || 0;
    const tempoTotalMinutos = horasEmMinutos + minutos;
    
    onSave({
      ...formData,
      tempoTrabalhado: tempoTotalMinutos,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[80vh] overflow-y-auto px-2">
      <div className="space-y-2">
        <Label htmlFor="date">Data</Label>
        <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData(p => ({...p, date: e.target.value}))} disabled={loading} required />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="preco-combustivel">Preço Combustível (R$/L)</Label>
          <Input id="preco-combustivel" type="number" min="0" step="0.01" placeholder="Ex: 5.89" value={formData.precoCombustivel || ''} onChange={(e) => handleChange('precoCombustivel', e.target.value)} disabled={loading} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="consumo-kml">Consumo (KM/L)</Label>
          <Input id="consumo-kml" type="number" min="0" step="0.1" placeholder="Ex: 11.5" value={formData.consumoKmL || ''} onChange={(e) => handleChange('consumoKmL', e.target.value)} disabled={loading} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tempo Trabalhado</Label>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <Input type="number" min="0" placeholder="Horas" value={time.horas} onChange={(e) => setTime(prev => ({ ...prev, horas: e.target.value }))} disabled={loading} />
            </div>
            <div>
                <Input type="number" min="0" max="59" placeholder="Minutos" value={time.minutos} onChange={(e) => setTime(prev => ({ ...prev, minutos: e.target.value }))} disabled={loading} />
            </div>
        </div>
      </div>

      <Card>
        <CardHeader className="py-4"><CardTitle className="text-base">Uber</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="corridas-uber">Nº de Corridas</Label>
              <Input id="corridas-uber" type="number" min="0" value={formData.numeroCorridasUber || ''} onChange={(e) => handleChange('numeroCorridasUber', e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="km-uber">KM Rodados</Label>
              <Input id="km-uber" type="number" min="0" step="0.1" value={formData.kmRodadosUber || ''} onChange={(e) => handleChange('kmRodadosUber', e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ganhos-uber">Ganhos (R$)</Label>
              <Input id="ganhos-uber" type="number" min="0" step="0.01" value={formData.ganhosUber || ''} onChange={(e) => handleChange('ganhosUber', e.target.value)} disabled={loading} />
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="py-4"><CardTitle className="text-base">99</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="corridas-99">Nº de Corridas</Label>
              <Input id="corridas-99" type="number" min="0" value={formData.numeroCorridas99 || ''} onChange={(e) => handleChange('numeroCorridas99', e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="km-99">KM Rodados</Label>
              <Input id="km-99" type="number" min="0" step="0.1" value={formData.kmRodados99 || ''} onChange={(e) => handleChange('kmRodados99', e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ganhos-99">Ganhos (R$)</Label>
              <Input id="ganhos-99" type="number" min="0" step="0.01" value={formData.ganhos99 || ''} onChange={(e) => handleChange('ganhos99', e.target.value)} disabled={loading} />
            </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Ganhos
        </Button>
      </div>
    </form>
  );
};