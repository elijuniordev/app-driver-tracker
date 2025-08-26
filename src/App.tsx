import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { AuthComponent } from '@/components/Auth'; // Correção 1: Nome do componente
import { Navigation } from '@/components/Navigation';
import { EnhancedDashboard } from '@/components/Dashboard';
import { DailyRegistry } from '@/components/DailyRegistry';
import { History } from '@/components/History';
import { Vehicles } from '@/components/Vehicles';
import { Toaster } from "@/components/ui/toaster";
import { useDriverData } from './hooks/useDriverData';

type ActiveTab = 'dashboard' | 'registro' | 'historico' | 'configuracoes';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const { 
    carConfig, 
    allCarConfigs, 
    dailyRecords, 
    loading, 
    // Correção 2: addDailyRecord não existe mais
    upsertEarnings,
    addExpense,
    addExtraEarning,
    saveCarConfig,
    setActiveCarConfig,
    deactivateCarConfig,
    updateDailyRecord,
    deleteDailyRecord
  } = useDriverData();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <EnhancedDashboard />;
      case 'registro':
        // Correção 3: DailyRegistry não precisa mais de props
        return <DailyRegistry />;
      case 'historico':
        return <History />;
      case 'configuracoes':
        return <Vehicles />;
      default:
        // Correção 3: DailyRegistry não precisa mais de props
        return <DailyRegistry />;
    }
  };

  if (!session) {
    return <AuthComponent />;
  } else {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="pb-16">
          {renderContent()}
        </main>
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <Toaster />
      </div>
    );
  }
}

export default App;