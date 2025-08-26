import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlusCircle, MinusCircle, Gift } from "lucide-react";
import { useDriverData, DailyRecord, ExtraEarning } from "@/hooks/useDriverData"; // Correção aqui
import { EarningsForm } from "./EarningsForm";
import { ExpenseForm } from "./ExpenseForm";
import { ExtraEarningForm } from "./ExtraEarningForm";

export const DailyRegistry = () => {
  const { upsertEarnings, addExpense, addExtraEarning, loading } = useDriverData(); // Correção aqui
  const [earningsModalOpen, setEarningsModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [extraEarningModalOpen, setExtraEarningModalOpen] = useState(false);

  const handleSaveEarnings = async (data: Omit<DailyRecord, 'id' | 'gastos' | 'ganhosExtras'>) => {
    await upsertEarnings(data);
    setEarningsModalOpen(false);
  };

  const handleSaveExpense = async (data: { data: string; valor: number; categoria: string }) => {
    await addExpense(data);
    setExpenseModalOpen(false);
  };

  const handleSaveExtraEarning = async (data: Omit<ExtraEarning, 'id' | 'entrada_diaria_id'>) => {
    await addExtraEarning(data);
    setExtraEarningModalOpen(false);
  };

  return (
    <div className="p-4 pb-20 max-w-2xl mx-auto text-center">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Registrar Atividade</h1>
        <p className="text-muted-foreground">Adicione seus ganhos ou despesas do dia.</p>
      </div>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button size="lg" onClick={() => setEarningsModalOpen(true)}>
          <PlusCircle className="mr-2 h-5 w-5" />
          Ganhos (Apps)
        </Button>
        <Button size="lg" onClick={() => setExtraEarningModalOpen(true)}>
          <Gift className="mr-2 h-5 w-5" />
          Ganhos Extras
        </Button>
        <Button size="lg" variant="outline" onClick={() => setExpenseModalOpen(true)}>
          <MinusCircle className="mr-2 h-5 w-5" />
          Nova Despesa
        </Button>
      </div>

      <Dialog open={earningsModalOpen} onOpenChange={setEarningsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Ganhos</DialogTitle>
          </DialogHeader>
          <EarningsForm 
            onSave={handleSaveEarnings} 
            onCancel={() => setEarningsModalOpen(false)} 
            loading={loading}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={expenseModalOpen} onOpenChange={setExpenseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Despesa</DialogTitle>
          </DialogHeader>
          <ExpenseForm 
            onSave={handleSaveExpense} 
            onCancel={() => setExpenseModalOpen(false)}
            loading={loading}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={extraEarningModalOpen} onOpenChange={setExtraEarningModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Ganho Extra</DialogTitle>
          </DialogHeader>
          <ExtraEarningForm 
            onSave={handleSaveExtraEarning} 
            onCancel={() => setExtraEarningModalOpen(false)}
            loading={loading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};