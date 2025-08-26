import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLocalISODate } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ExpenseFormProps {
  onSave: (expense: { data: string; valor: number; categoria: string }) => void;
  onCancel: () => void;
  loading: boolean;
}

const expenseCategories = ['Combustível', 'Limpeza', 'Almoço', 'Pedágio', 'Estacionamento', 'Outros'];

export const ExpenseForm = ({ onSave, onCancel, loading }: ExpenseFormProps) => {
  const [data, setData] = useState(getLocalISODate());
  const [valor, setValor] = useState<number | ''>('');
  const [categoria, setCategoria] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Garante que 'valor' seja um número para a verificação e o envio
    if (typeof valor === 'number' && valor > 0 && categoria) {
      onSave({ data, valor, categoria });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="expense-date">Data da Despesa</Label>
        <Input id="expense-date" type="date" value={data} onChange={(e) => setData(e.target.value)} disabled={loading} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="expense-value">Valor (R$)</Label>
        <Input id="expense-value" type="number" min="0.01" step="0.01" value={valor} onChange={(e) => setValor(parseFloat(e.target.value) || '')} disabled={loading} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="expense-category">Categoria</Label>
        <Select value={categoria} onValueChange={setCategoria} disabled={loading}>
          <SelectTrigger id="expense-category">
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {expenseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading || !categoria || !valor}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Despesa
        </Button>
      </div>
    </form>
  );
};