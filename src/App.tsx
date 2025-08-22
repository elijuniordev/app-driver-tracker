import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Dashboard } from "@/components/Dashboard"; 
import { DailyRegistry } from "@/components/DailyRegistry";
import { CarConfig } from "@/components/CarConfig";
import { Auth } from "@/components/Auth";
import { History } from "@/components/History";
import { IndividualRides } from "@/components/IndividualRides";
import { useDriverData } from "@/hooks/useDriverData";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const App = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'registro' | 'configuracoes' | 'historico' | 'corridas'>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { carConfig, saveCarConfig, addDailyRecord, fetchDailyRecords } = useDriverData();

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Fetch data when user logs in
        fetchDailyRecords();
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchDailyRecords]);

  const handleAuthSuccess = () => {
    // Data will be fetched automatically via auth state change
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Auth onAuthSuccess={handleAuthSuccess} />
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'corridas':
        return <IndividualRides />;
      case 'registro':
        return <DailyRegistry onSave={addDailyRecord} carConfig={carConfig} />;
      case 'historico':
        return <History />;
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
