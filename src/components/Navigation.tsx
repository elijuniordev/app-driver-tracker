import { Settings, Plus, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavigationProps {
  activeTab: 'dashboard' | 'registro' | 'configuracoes';
  onTabChange: (tab: 'dashboard' | 'registro' | 'configuracoes') => void;
}

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
    { id: 'registro' as const, label: 'Registrar', icon: Plus },
    { id: 'configuracoes' as const, label: 'Configurações', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2 z-50">
      <div className="flex justify-around max-w-md mx-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={activeTab === id ? "default" : "ghost"}
            size="sm"
            onClick={() => onTabChange(id)}
            className="flex flex-col items-center gap-1 h-auto py-2 px-3"
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
};