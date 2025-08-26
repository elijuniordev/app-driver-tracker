import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DailyRecord } from "@/hooks/useDriverData";
import { useState, useEffect } from "react";

interface EditRecordFormProps {
  record: DailyRecord;
  onSave: (data: Partial<DailyRecord>) => void;
  onCancel: () => void;
}

export const EditRecordForm = ({ record, onSave, onCancel }: EditRecordFormProps) => {
  const [formData, setFormData] = useState({
    ganhosUber: 0,
    ganhos99: 0,
    kmRodadosUber: 0,
    kmRodados99: 0,
    tempoTrabalhado: 0,
  });

  useEffect(() => {
    setFormData({
      ganhosUber: record.ganhosUber,
      ganhos99: record.ganhos99,
      kmRodadosUber: record.kmRodadosUber,
      kmRodados99: record.kmRodados99,
      tempoTrabalhado: record.tempoTrabalhado,
    });
  }, [record]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Ganhos Uber (R$)</label>
          <Input
            type="number"
            step="0.01"
            value={formData.ganhosUber}
            onChange={(e) => setFormData(prev => ({ ...prev, ganhosUber: parseFloat(e.target.value) || 0 }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Ganhos 99 (R$)</label>
          <Input
            type="number"
            step="0.01"
            value={formData.ganhos99}
            onChange={(e) => setFormData(prev => ({ ...prev, ganhos99: parseFloat(e.target.value) || 0 }))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">KM Rodados Uber</label>
          <Input
            type="number"
            step="0.1"
            value={formData.kmRodadosUber}
            onChange={(e) => setFormData(prev => ({ ...prev, kmRodadosUber: parseFloat(e.target.value) || 0 }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">KM Rodados 99</label>
          <Input
            type="number"
            step="0.1"
            value={formData.kmRodados99}
            onChange={(e) => setFormData(prev => ({ ...prev, kmRodados99: parseFloat(e.target.value) || 0 }))}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Tempo Trabalhado (min)</label>
        <Input
          type="number"
          value={formData.tempoTrabalhado}
          onChange={(e) => setFormData(prev => ({ ...prev, tempoTrabalhado: parseInt(e.target.value) || 0 }))}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Salvar Alterações
        </Button>
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
      </div>
    </form>
  );
};