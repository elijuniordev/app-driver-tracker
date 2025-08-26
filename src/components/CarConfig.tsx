import { useState } from "react";
import { Car, Save, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { CarConfig as CarConfigType } from "@/hooks/useDriverData";
import { cn, createLocalDate } from "@/lib/utils";

interface CarConfigProps {
  config: CarConfigType;
  onSave: (config: CarConfigType) => void;
}

export const CarConfig = ({ config, onSave }: CarConfigProps) => {
  const [formData, setFormData] = useState<CarConfigType>(config);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    toast({
      title: "Configurações salvas!",
      description: "As configurações do seu veículo foram atualizadas.",
    });
  };

  const handleChange = (field: keyof CarConfigType, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: ['modelo', 'dataInicioContrato'].includes(field) ? value : parseFloat(value) || 0,
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      handleChange('dataInicioContrato', format(date, 'yyyy-MM-dd'));
      setIsPopoverOpen(false);
    }
  };

  return (
    <div className="p-4 pb-20 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Configurações do Veículo</h1>
        <p className="text-muted-foreground">Configure as informações do seu carro para cálculos precisos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Informações do Veículo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  onChange={(e) => handleChange('aluguelSemanal', e.target.value)}
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
                  onChange={(e) => handleChange('limiteKmSemanal', e.target.value)}
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
                  onChange={(e) => handleChange('valorKmExcedido', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="consumo-kml">Consumo do Carro (KM/L)</Label>
                <Input
                  id="consumo-kml"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Ex: 12.5"
                  value={formData.consumoKmL || ''}
                  onChange={(e) => handleChange('consumoKmL', e.target.value)}
                />
              </div>
            </div>

            {/* Novos campos para data de início e duração do contrato */}
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
                  onChange={(e) => handleChange('duracaoContratoDias', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco-combustivel">Preço do Combustível (R$/L)</Label>
              <Input
                id="preco-combustivel"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 5.50"
                value={formData.precoCombustivel || ''}
                onChange={(e) => handleChange('precoCombustivel', e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};