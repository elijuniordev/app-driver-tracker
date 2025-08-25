import { useState } from "react";
import { Edit, Trash2, Calendar, DollarSign, Route, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useDriverData, DailyRecord } from "@/hooks/useDriverData";
import { useToast } from "@/hooks/use-toast";

export const History = () => {
  const { dailyRecords, updateDailyRecord, deleteDailyRecord } = useDriverData();
  const [editingRecord, setEditingRecord] = useState<DailyRecord | null>(null);
  const [editForm, setEditForm] = useState({
    ganhosUber: 0,
    ganhos99: 0,
    kmRodados: 0,
    tempoTrabalhado: 0,
    consumoKmL: 0
  });
  const { toast } = useToast();

  const handleEdit = (record: DailyRecord) => {
    setEditingRecord(record);
    setEditForm({
      ganhosUber: record.ganhosUber,
      ganhos99: record.ganhos99,
      kmRodados: record.kmRodadosUber + record.kmRodados99,
      tempoTrabalhado: record.tempoTrabalhado,
      consumoKmL: 10 // Valor padrão
    });
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    
    await updateDailyRecord(editingRecord.id, editForm);
    setEditingRecord(null);
    toast({
      title: "Registro atualizado",
      description: "As alterações foram salvas com sucesso."
    });
  };

  const handleDelete = async (id: number) => {
    await deleteDailyRecord(id);
    toast({
      title: "Registro excluído",
      description: "O registro foi removido com sucesso."
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const sortedRecords = dailyRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-4 pb-20 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Histórico de Registros</h1>
        <p className="text-muted-foreground">Visualize, edite e exclua seus registros diários</p>
      </div>

      <div className="space-y-4">
        {sortedRecords.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Nenhum registro encontrado.</p>
              <p className="text-sm text-muted-foreground mt-2">Vá para a aba "Registrar" para adicionar dados.</p>
            </CardContent>
          </Card>
        ) : (
          sortedRecords.map((record) => {
            const totalGastos = record.gastos.reduce((sum, gasto) => sum + gasto.valor, 0);
            const ganhosBrutos = record.ganhosUber + record.ganhos99;
            const lucroLiquido = ganhosBrutos - totalGastos;

            return (
              <Card key={record.id} className="transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      {formatDate(record.date)}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Dialog open={editingRecord?.id === record.id} onOpenChange={(open) => !open && setEditingRecord(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(record)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Registro - {formatDate(record.date)}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Ganhos Uber (R$)</label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editForm.ganhosUber}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, ganhosUber: parseFloat(e.target.value) || 0 }))}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Ganhos 99 (R$)</label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editForm.ganhos99}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, ganhos99: parseFloat(e.target.value) || 0 }))}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">KM Rodados</label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={editForm.kmRodados}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, kmRodados: parseFloat(e.target.value) || 0 }))}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Tempo Trabalhado (min)</label>
                                <Input
                                  type="number"
                                  value={editForm.tempoTrabalhado}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, tempoTrabalhado: parseInt(e.target.value) || 0 }))}
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Consumo KM/L</label>
                              <Input
                                type="number"
                                step="0.1"
                                value={editForm.consumoKmL}
                                onChange={(e) => setEditForm(prev => ({ ...prev, consumoKmL: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handleSaveEdit} className="flex-1">
                                Salvar Alterações
                              </Button>
                              <Button variant="outline" onClick={() => setEditingRecord(null)} className="flex-1">
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o registro do dia {formatDate(record.date)}? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(record.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-success" />
                      <div>
                        <p className="text-sm text-muted-foreground">Ganhos Brutos</p>
                        <p className="font-medium">R$ {ganhosBrutos.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-destructive" />
                      <div>
                        <p className="text-sm text-muted-foreground">Gastos</p>
                        <p className="font-medium">R$ {totalGastos.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className={`h-4 w-4 ${lucroLiquido >= 0 ? 'text-success' : 'text-destructive'}`} />
                      <div>
                        <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                        <p className={`font-medium ${lucroLiquido >= 0 ? 'text-success' : 'text-destructive'}`}>
                          R$ {lucroLiquido.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Tempo</p>
                        <p className="font-medium">{formatTime(record.tempoTrabalhado)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Uber: </span>
                        <span className="font-medium">R$ {record.ganhosUber.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">99: </span>
                        <span className="font-medium">R$ {record.ganhos99.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">KM: </span>
                        <span className="font-medium">{(record.kmRodadosUber + record.kmRodados99).toFixed(1)} km</span>
                      </div>
                    </div>

                    {record.gastos.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Gastos:</p>
                        <div className="flex flex-wrap gap-2">
                          {record.gastos.map((gasto, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs"
                            >
                              {gasto.categoria}: R$ {gasto.valor.toFixed(2)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};