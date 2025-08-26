import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLocalISODate } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ExtraEarning } from "@/hooks/useDriverData";

type EarningData = Omit<ExtraEarning, 'id' | 'entrada_diaria_id'>;

interface ExtraEarningFormProps {
  onSave: (earning: EarningData) => void;
  onCancel: () => void;
  loading: boolean;
}

const earningCategories = ["Venda a Bordo", "Corrida Particular", "Gorjeta", "Outros"];

export const ExtraEarningForm = ({ onSave, onCancel, loading }: ExtraEarningFormProps) => {
  const [data, setData] = useState(getLocalISODate());
  const [valor, setValor] = useState<number | ''>('');
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState(''); // De 'produto' para 'descricao'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof valor === 'number' && valor > 0 && categoria) {
      onSave({ data, valor, categoria, descricao }); // Passa a nova descrição
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="earning-date">Data do Ganho</Label>
        <Input id="earning-date" type="date" value={data} onChange={(e) => setData(e.target.value)} disabled={loading} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="earning-value">Valor (R$)</Label>
        <Input id="earning-value" type="number" min="0.01" step="0.01" value={valor} onChange={(e) => setValor(parseFloat(e.target.value) || '')} disabled={loading} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="earning-category">Categoria</Label>
        <Select value={categoria} onValueChange={setCategoria} disabled={loading}>
          <SelectTrigger id="earning-category">
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {earningCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      
      {/* Campo de Descrição agora é sempre visível */}
      <div className="space-y-2">
        <Label htmlFor="earning-description">Descrição (Opcional)</Label>
        <Input id="earning-description" type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} disabled={loading} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading || !categoria || !valor}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Ganho
        </Button>
      </div>
    </form>
  );
};