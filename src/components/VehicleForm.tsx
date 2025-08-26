import { useState, useEffect } from "react";
import { Car, Save, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CarConfig as CarConfigType } from "@/hooks/useDriverData";
import { cn, createLocalDate } from "@/lib/utils";

interface VehicleFormProps {
  initialData: CarConfigType | null;
  onSave: (config: CarConfigType) => void;
  onCancel: () => void;
}

// O nome do componente e da interface de props foi alterado aqui
export const VehicleForm = ({ initialData, onSave, onCancel }: VehicleFormProps) => {
  const [formData, setFormData] = useState<CarConfigType>(
    initialData || {
      modelo: '',
      aluguelSemanal: 0,
      limiteKmSemanal: 0,
      valorKmExcedido: 0,
      dataInicioContrato: new Date().toISOString().split('T')[0],
      duracaoContratoDias: 60,
      metaGanhosSemanal: 0,
      is_active: true,
    }
  );
  
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: keyof CarConfigType, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNumericChange = (field: keyof CarConfigType, value: string) => {
    handleChange(field, parseFloat(value) || 0);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      handleChange('dataInicioContrato', format(date, 'yyyy-MM-dd'));
      setIsPopoverOpen(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="modelo">Modelo do Carro</Label>
        <Input
          id="modelo"
          type="text"
          placeholder="Ex: Onix 2023"
          value={formData.modelo}
          onChange={(e) => handleChange('modelo', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="meta-ganhos">Meta de Ganhos Semanal (R$)</Label>
        <Input
          id="meta-ganhos"
          type="number"
          min="0"
          step="50"
          placeholder="Ex: 1500"
          value={formData.metaGanhosSemanal || ''}
          onChange={(e) => handleNumericChange('metaGanhosSemanal', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="aluguel">Aluguel Semanal (R$)</Label>
          <Input
            id="aluguel"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={formData.aluguelSemanal || ''}
            onChange={(e) => handleNumericChange('aluguelSemanal', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="limite-km">Limite KM Semanal</Label>
          <Input
            id="limite-km"
            type="number"
            min="0"
            placeholder="0"
            value={formData.limiteKmSemanal || ''}
            onChange={(e) => handleNumericChange('limiteKmSemanal', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valor-km">Valor por KM Excedido (R$)</Label>
          <Input
            id="valor-km"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={formData.valorKmExcedido || ''}
            onChange={(e) => handleNumericChange('valorKmExcedido', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="data-inicio">Data de Início do Contrato</Label>
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.dataInicioContrato && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.dataInicioContrato ? (
                  format(createLocalDate(formData.dataInicioContrato), "PPP", { locale: ptBR })
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={createLocalDate(formData.dataInicioContrato)}
                onSelect={handleDateChange}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="duracao">Duração do Contrato (dias)</Label>
          <Input
            id="duracao"
            type="number"
            min="0"
            placeholder="Ex: 60"
            value={formData.duracaoContratoDias || ''}
            onChange={(e) => handleNumericChange('duracaoContratoDias', e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Salvar
        </Button>
      </div>
    </form>
  );
};