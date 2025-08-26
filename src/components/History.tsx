import { useState } from "react";
import { useDriverData, DailyRecord } from "@/hooks/useDriverData";
import { getDailyAnalysis } from "@/components/dashboard/dashboard-helpers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, Calendar, DollarSign, Briefcase } from "lucide-react";
import { EditRecordModal } from "./EditRecordModal";
import { createLocalDate } from "@/lib/utils";

export const History = () => {
  const { dailyRecords, carConfig, deleteDailyRecord, updateDailyRecord, loading } = useDriverData();
  const [editingRecord, setEditingRecord] = useState<DailyRecord | null>(null);

  const handleSaveEdit = async (updatedRecord: DailyRecord) => {
    await updateDailyRecord(updatedRecord);
    setEditingRecord(null);
  };
  
  const sortedRecords = [...dailyRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-4 pb-20 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Histórico de Registros</h1>
        <p className="text-muted-foreground">Visualize e edite os detalhes de cada dia de trabalho.</p>
      </div>

      <Dialog open={!!editingRecord} onOpenChange={(isOpen) => !isOpen && setEditingRecord(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar Registro - {editingRecord ? format(createLocalDate(editingRecord.date), "PPP", { locale: ptBR }) : ""}</DialogTitle>
          </DialogHeader>
          {editingRecord && (
            <EditRecordModal 
              record={editingRecord}
              onSave={handleSaveEdit}
              onCancel={() => setEditingRecord(null)}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>
      
      <div className="space-y-4">
        {loading ? ( <p className="text-center">Carregando histórico...</p> ) :
         sortedRecords.length === 0 ? (
          <Card className="text-center p-8"><p>Nenhum registro encontrado.</p></Card>
        ) : (
          sortedRecords.map((record) => {
            const analysis = getDailyAnalysis(record.date, dailyRecords, carConfig);
            if (!analysis) return null;

            return (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />{format(createLocalDate(record.date), "PPP", { locale: ptBR })}</CardTitle>
                      <CardDescription>Resumo do dia</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingRecord(record)}><Edit className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle></AlertDialogHeader>
                          <AlertDialogDescription>Tem certeza que deseja excluir o registro deste dia? Esta ação não pode ser desfeita.</AlertDialogDescription>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteDailyRecord(record.id)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-blue-500" /><div><p className="text-muted-foreground">Faturamento</p><p className="font-bold">R$ {analysis.ganhosBrutos.toFixed(2)}</p></div></div>
                  <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-red-500" /><div><p className="text-muted-foreground">Gastos</p><p className="font-bold">R$ {analysis.gastosTotal.toFixed(2)}</p></div></div>
                  <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-green-500" /><div><p className="text-muted-foreground">Lucro Líquido</p><p className="font-bold text-lg text-green-500">R$ {analysis.lucroLiquido.toFixed(2)}</p></div></div>
                  <div className="flex items-center gap-2"><Briefcase className="h-4 w-4" /><div><p className="text-muted-foreground">Viagens</p><p className="font-bold">{analysis.totalViagens}</p></div></div>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-4 text-xs pt-4">
                    {Object.values(analysis.earningsByCategory).some(val => val > 0) && (
                        <div>
                            <p className="font-semibold mb-2">Detalhes dos Ganhos:</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                                {Object.entries(analysis.earningsByCategory).map(([cat, val]) => val > 0 && (<div key={cat} className="flex gap-2 items-center"><div className="w-2 h-2 rounded-full bg-blue-500" /><span>{cat}: R$ {val.toFixed(2)}</span></div>))}
                            </div>
                        </div>
                    )}
                    {Object.values(analysis.expensesByCategory).some(val => val > 0) && (
                        <div>
                            <p className="font-semibold mb-2">Detalhes dos Gastos:</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                                {Object.entries(analysis.expensesByCategory).map(([cat, val]) => val > 0 && (<div key={cat} className="flex gap-2 items-center"><div className="w-2 h-2 rounded-full bg-red-500" /><span>{cat}: R$ {val.toFixed(2)}</span></div>))}
                            </div>
                        </div>
                    )}
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};