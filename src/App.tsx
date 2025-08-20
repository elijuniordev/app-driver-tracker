import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Dashboard } from "@/components/Dashboard"; 
import { DailyRegistry } from "@/components/DailyRegistry";
import { CarConfig } from "@/components/CarConfig";
import { useDriverData } from "@/hooks/useDriverData";

const queryClient = new QueryClient();

const App = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'registro' | 'configuracoes'>('dashboard');
  const { carConfig, saveCarConfig, addDailyRecord } = useDriverData();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'registro':
        return <DailyRegistry onSave={addDailyRecord} />;
      case 'configuracoes':
        return <CarConfig config={carConfig} onSave={saveCarConfig} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <main className="relative">
            {renderContent()}
          </main>
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
