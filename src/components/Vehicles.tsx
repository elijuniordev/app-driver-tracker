import { useState } from "react";
import { useDriverData, CarConfig } from "@/hooks/useDriverData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlusCircle, Car, CheckCircle2, Edit, XCircle } from "lucide-react"; // Adicionado XCircle
import { VehicleForm } from "./VehicleForm";

export const Vehicles = () => {
  // Adicionar a nova função deactivateCarConfig
  const { allCarConfigs, saveCarConfig, setActiveCarConfig, deactivateCarConfig, loading } = useDriverData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarConfig | null>(null);

  const handleSave = async (config: CarConfig) => {
    await saveCarConfig(config);
    setIsFormOpen(false);
    setSelectedCar(null);
  };

  const handleAddNew = () => {
    setSelectedCar(null);
    setIsFormOpen(true);
  };
  
  const handleEdit = (car: CarConfig) => {
    setSelectedCar(car);
    setIsFormOpen(true);
  };

  return (
    <div className="p-4 pb-20 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meus Veículos</h1>
          <p className="text-muted-foreground">Gerencie o histórico de veículos utilizados.</p>
        </div>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Veículo
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCar ? "Editar Veículo" : "Adicionar Novo Veículo"}</DialogTitle>
          </DialogHeader>
          <VehicleForm
            initialData={selectedCar}
            onSave={handleSave}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <div className="space-y-4">
        {loading && <p>Carregando veículos...</p>}
        {allCarConfigs.length === 0 && !loading && (
          <Card className="text-center p-8">
             <CardTitle>Nenhum veículo cadastrado</CardTitle>
             <CardDescription className="mt-2">Clique em "Adicionar Veículo" para começar.</CardDescription>
          </Card>
        )}
        {allCarConfigs.map((car) => (
          <Card key={car.id} className={car.is_active ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    {car.modelo}
                  </CardTitle>
                  <CardDescription>
                    {car.is_active && (
                      <span className="text-xs font-semibold text-primary flex items-center gap-1 mt-1">
                        <CheckCircle2 className="h-3 w-3" /> Veículo Ativo
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(car)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  {/* Lógica condicional para os botões Ativar/Desativar */}
                  {car.is_active ? (
                    <Button variant="destructive" size="sm" onClick={() => deactivateCarConfig(car.id!)} disabled={loading}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Desativar
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setActiveCarConfig(car.id!)} disabled={loading}>
                      Tornar Ativo
                    </Button>
                  )}

                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground grid grid-cols-2 md:grid-cols-4 gap-4">
               <div><strong>Aluguel:</strong> R$ {car.aluguelSemanal}/sem</div>
               <div><strong>Limite:</strong> {car.limiteKmSemanal} km/sem</div>
               <div><strong>Contrato:</strong> {car.duracaoContratoDias} dias</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};