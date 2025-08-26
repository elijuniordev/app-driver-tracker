import { useState, useEffect } from "react";
import { DailyRecord, Expense, ExtraEarning } from "@/hooks/useDriverData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";

interface EditRecordModalProps {
  record: DailyRecord;
  onSave: (updatedRecord: DailyRecord) => void;
  onCancel: () => void;
  loading: boolean;
}

const expenseCategories = ['Combustível', 'Limpeza', 'Almoço', 'Pedágio', 'Estacionamento', 'Outros'];
const earningCategories = ["Venda a Bordo", "Corrida Particular", "Gorjeta", "Outros"];

export const EditRecordModal = ({ record, onSave, onCancel, loading }: EditRecordModalProps) => {
  const [formData, setFormData] = useState<DailyRecord>(record);
  const [time, setTime] = useState({ horas: '0', minutos: '0' });
  const [newExpense, setNewExpense] = useState({ valor: '', categoria: '' });
  const [newEarning, setNewEarning] = useState({ valor: '', categoria: '', descricao: '' });

  useEffect(() => {
    const totalMinutes = record.tempoTrabalhado || 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    setTime({ horas: hours.toString(), minutos: minutes.toString() });
    setFormData(JSON.parse(JSON.stringify(record)));
  }, [record]);

  const handleChange = (field: keyof Omit<DailyRecord, 'id' | 'gastos' | 'ganhosExtras' | 'date' | 'tempoTrabalhado'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };
  
  const handleExpenseChange = (index: number, field: 'valor' | 'categoria', value: string | number) => {
    const updatedItems = [...formData.gastos];
    updatedItems[index] = { ...updatedItems[index], [field]: field === 'valor' ? parseFloat(value as string) || 0 : value };
    setFormData(prev => ({ ...prev, gastos: updatedItems }));
  };
  
  const addExpense = () => {
    if (newExpense.valor && newExpense.categoria) {
      const expenseToAdd: Expense = { id: Date.now(), valor: parseFloat(newExpense.valor), categoria: newExpense.categoria };
      setFormData(prev => ({ ...prev, gastos: [...prev.gastos, expenseToAdd] }));
      setNewExpense({ valor: '', categoria: '' });
    }
  };
  
  const removeExpense = (id: number) => {
    setFormData(prev => ({ ...prev, gastos: prev.gastos.filter(g => g.id !== id) }));
  };

  const handleEarningChange = (index: number, field: 'valor' | 'categoria' | 'descricao', value: string | number) => {
    const updatedItems = [...formData.ganhosExtras];
    const key = field as keyof ExtraEarning;
    (updatedItems[index] as unknown)[key] = field === 'valor' ? parseFloat(value as string) || 0 : value;
    setFormData(prev => ({ ...prev, ganhosExtras: updatedItems }));
  };

  const addEarning = () => {
    if (newEarning.valor && newEarning.categoria) {
      const earningToAdd: ExtraEarning = { id: Date.now(), data: formData.date, valor: parseFloat(newEarning.valor), categoria: newEarning.categoria, descricao: newEarning.descricao };
      setFormData(prev => ({ ...prev, ganhosExtras: [...prev.ganhosExtras, earningToAdd] }));
      setNewEarning({ valor: '', categoria: '', descricao: '' });
    }
  };
  
  const removeEarning = (id: number) => {
    setFormData(prev => ({ ...prev, ganhosExtras: prev.ganhosExtras.filter(g => g.id !== id) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalMinutes = (parseInt(time.horas) || 0) * 60 + (parseInt(time.minutos) || 0);
    onSave({ ...formData, tempoTrabalhado: totalMinutes });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[80vh] overflow-y-auto px-2">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div><Label>Ganhos Uber</Label><Input type="number" step="0.01" value={formData.ganhosUber} onChange={e => handleChange('ganhosUber', e.target.value)} /></div>
        <div><Label>Ganhos 99</Label><Input type="number" step="0.01" value={formData.ganhos99} onChange={e => handleChange('ganhos99', e.target.value)} /></div>
        <div><Label>KM Uber</Label><Input type="number" step="0.1" value={formData.kmRodadosUber} onChange={e => handleChange('kmRodadosUber', e.target.value)} /></div>
        <div><Label>KM 99</Label><Input type="number" step="0.1" value={formData.kmRodados99} onChange={e => handleChange('kmRodados99', e.target.value)} /></div>
        <div><Label>Corridas Uber</Label><Input type="number" value={formData.numeroCorridasUber} onChange={e => handleChange('numeroCorridasUber', e.target.value)} /></div>
        <div><Label>Corridas 99</Label><Input type="number" value={formData.numeroCorridas99} onChange={e => handleChange('numeroCorridas99', e.target.value)} /></div>
        <div><Label>Consumo (KM/L)</Label><Input type="number" step="0.1" value={formData.consumoKmL} onChange={e => handleChange('consumoKmL', e.target.value)} /></div>
        <div><Label>Preço Combustível</Label><Input type="number" step="0.01" value={formData.precoCombustivel} onChange={e => handleChange('precoCombustivel', e.target.value)} /></div>
      </div>

      <div className="space-y-2">
        <Label>Tempo Trabalhado</Label>
        <div className="grid grid-cols-2 gap-4">
            <div><Input type="number" min="0" placeholder="Horas" value={time.horas} onChange={(e) => setTime(prev => ({ ...prev, horas: e.target.value }))} /></div>
            <div><Input type="number" min="0" max="59" placeholder="Minutos" value={time.minutos} onChange={(e) => setTime(prev => ({ ...prev, minutos: e.target.value }))} /></div>
        </div>
      </div>
      <Separator />

      <Card>
        <CardHeader><CardTitle className="text-base">Ganhos Extras</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {formData.ganhosExtras.map((ganho, index) => (
            <div key={ganho.id} className="flex gap-2 items-center">
              <Input className="flex-1" placeholder="Descrição" value={ganho.descricao} onChange={(e) => handleEarningChange(index, 'descricao', e.target.value)} />
              <Input className="w-28" type="number" step="0.01" value={ganho.valor} onChange={(e) => handleEarningChange(index, 'valor', e.target.value)} />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeEarning(ganho.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <div className="flex gap-2 items-center pt-2">
              <Select value={newEarning.categoria} onValueChange={(val) => setNewEarning(p => ({...p, categoria: val}))}>
                <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>{earningCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
              </Select>
              <Input className="w-28" type="number" step="0.01" placeholder="Valor" value={newEarning.valor} onChange={(e) => setNewEarning(p => ({...p, valor: e.target.value}))} />
              <Button type="button" variant="outline" size="icon" onClick={addEarning}><PlusCircle className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle className="text-base">Despesas Manuais</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {formData.gastos.map((gasto, index) => (
            <div key={gasto.id} className="flex gap-2 items-center">
              <Input className="flex-1" value={gasto.categoria} onChange={(e) => handleExpenseChange(index, 'categoria', e.target.value)} />
              <Input className="w-28" type="number" step="0.01" value={gasto.valor} onChange={(e) => handleExpenseChange(index, 'valor', e.target.value)} />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeExpense(gasto.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
           <div className="flex gap-2 items-center pt-2">
              <Select value={newExpense.categoria} onValueChange={(val) => setNewExpense(p => ({...p, categoria: val}))}>
                <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>{expenseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
              </Select>
              <Input className="w-28" type="number" step="0.01" placeholder="Valor" value={newExpense.valor} onChange={(e) => setNewExpense(p => ({...p, valor: e.target.value}))} />
              <Button type="button" variant="outline" size="icon" onClick={addExpense}><PlusCircle className="h-4 w-4" /></Button>
            </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
        </Button>
      </div>
    </form>
  );
};