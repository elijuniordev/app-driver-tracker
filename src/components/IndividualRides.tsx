import { useState, useEffect } from "react";
import { Plus, Trash2, Clock, DollarSign, Car } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface IndividualRide {
  id: number;
  plataforma: 'uber' | '99';
  valor: number;
  horario?: string;
  data_hora: string;
  numero_viagens: number;
  km_rodados: number;
  consumo_km_l: number;
  preco_combustivel: number;
  tempo_trabalhado: number;
}

interface DailySummary {
  uberTotal: number;
  nineNineTotal: number;
  totalRides: number;
  totalEarnings: number;
}

export const IndividualRides = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rides, setRides] = useState<IndividualRide[]>([]);
  const [newRide, setNewRide] = useState({
    plataforma: '' as 'uber' | '99' | '',
    valor: 0,
    data_hora: new Date().toISOString().slice(0, 16),
    numero_viagens: 1,
    km_rodados: 0,
    consumo_km_l: 0,
    preco_combustivel: 0,
    tempo_trabalhado: 0
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchRides = async () => {
    try {
      setLoading(true);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      // Get all rides for the selected date (standalone approach)
      const { data: corridasData, error } = await supabase
        .from('corridas_individuais')
        .select('*')
        .eq('user_id', user.id)
        .gte('data_hora', selectedDate + 'T00:00:00')
        .lt('data_hora', new Date(new Date(selectedDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T00:00:00')
        .order('data_hora', { ascending: true });

      if (error) throw error;

      setRides(corridasData?.map(ride => ({
        ...ride,
        plataforma: ride.plataforma as 'uber' | '99'
      })) || []);
    } catch (error) {
      console.error('Error fetching rides:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [selectedDate]);

  const addRide = async () => {
    if (!newRide.plataforma || !newRide.valor || !newRide.data_hora || !newRide.numero_viagens) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos obrigatórios."
      });
      return;
    }

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      // Add the individual ride (standalone approach)
      const { error: rideError } = await supabase
        .from('corridas_individuais')
        .insert({
          entrada_diaria_id: null,
          plataforma: newRide.plataforma,
          valor: newRide.valor,
          data_hora: newRide.data_hora,
          numero_viagens: newRide.numero_viagens,
          km_rodados: newRide.km_rodados,
          consumo_km_l: newRide.consumo_km_l,
          preco_combustivel: newRide.preco_combustivel,
          tempo_trabalhado: newRide.tempo_trabalhado,
          user_id: user.id
        });

      if (rideError) throw rideError;

      setNewRide({ 
        plataforma: '', 
        valor: 0, 
        data_hora: new Date().toISOString().slice(0, 16),
        numero_viagens: 1,
        km_rodados: 0,
        consumo_km_l: 0,
        preco_combustivel: 0,
        tempo_trabalhado: 0
      });
      fetchRides();
      
      toast({
        title: "Corrida adicionada",
        description: "A corrida foi registrada com sucesso."
      });
    } catch (error) {
      console.error('Error adding ride:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao adicionar corrida."
      });
    }
  };

  const deleteRide = async (rideId: number) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      // Delete the ride (standalone approach)
      const { error } = await supabase
        .from('corridas_individuais')
        .delete()
        .eq('id', rideId)
        .eq('user_id', user.id);

      if (error) throw error;

      fetchRides();
      
      toast({
        title: "Corrida removida",
        description: "A corrida foi excluída com sucesso."
      });
    } catch (error) {
      console.error('Error deleting ride:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao excluir corrida."
      });
    }
  };


  const getDailySummary = (): DailySummary => {
    const uberTotal = rides.filter(r => r.plataforma === 'uber').reduce((sum, r) => sum + r.valor, 0);
    const nineNineTotal = rides.filter(r => r.plataforma === '99').reduce((sum, r) => sum + r.valor, 0);
    
    return {
      uberTotal,
      nineNineTotal,
      totalRides: rides.reduce((sum, r) => sum + r.numero_viagens, 0),
      totalEarnings: uberTotal + nineNineTotal
    };
  };

  const summary = getDailySummary();

  return (
    <div className="p-4 pb-20 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Corridas Individuais</h1>
        <p className="text-muted-foreground">Registre cada corrida separadamente</p>
      </div>

      {/* Date Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Selecionar Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="max-w-xs"
          />
        </CardContent>
      </Card>

      {/* Daily Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Resumo do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Uber</p>
              <p className="text-2xl font-bold text-primary">R$ {summary.uberTotal.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">99</p>
              <p className="text-2xl font-bold text-secondary">R$ {summary.nineNineTotal.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Corridas</p>
              <p className="text-2xl font-bold">{summary.totalRides}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Ganhos</p>
              <p className="text-2xl font-bold text-success">R$ {summary.totalEarnings.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Ride */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Nova Corrida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Data e Hora</Label>
              <Input
                type="datetime-local"
                value={newRide.data_hora}
                onChange={(e) => setNewRide(prev => ({ ...prev, data_hora: e.target.value }))}
              />
            </div>
            <div>
              <Label>Plataforma</Label>
              <Select value={newRide.plataforma} onValueChange={(value: 'uber' | '99') => setNewRide(prev => ({ ...prev, plataforma: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uber">Uber</SelectItem>
                  <SelectItem value="99">99</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ganho Bruto (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newRide.valor || ''}
                onChange={(e) => setNewRide(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label>Número de Viagens</Label>
              <Input
                type="number"
                min="1"
                value={newRide.numero_viagens || ''}
                onChange={(e) => setNewRide(prev => ({ ...prev, numero_viagens: parseInt(e.target.value) || 1 }))}
                placeholder="1"
              />
            </div>
            <div>
              <Label>Km Rodados</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={newRide.km_rodados || ''}
                onChange={(e) => setNewRide(prev => ({ ...prev, km_rodados: parseFloat(e.target.value) || 0 }))}
                placeholder="0.0"
              />
            </div>
            <div>
              <Label>Consumo (km/l)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={newRide.consumo_km_l || ''}
                onChange={(e) => setNewRide(prev => ({ ...prev, consumo_km_l: parseFloat(e.target.value) || 0 }))}
                placeholder="0.0"
              />
            </div>
            <div>
              <Label>Preço Combustível (R$/l)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newRide.preco_combustivel || ''}
                onChange={(e) => setNewRide(prev => ({ ...prev, preco_combustivel: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tempo Trabalhado (minutos)</Label>
              <Input
                type="number"
                min="0"
                value={newRide.tempo_trabalhado || ''}
                onChange={(e) => setNewRide(prev => ({ ...prev, tempo_trabalhado: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addRide} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Corrida
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rides List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Corridas do Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground">Carregando...</p>
          ) : rides.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhuma corrida registrada para esta data.</p>
          ) : (
            <div className="space-y-3">
              {rides.map((ride) => (
                <div key={ride.id} className="p-4 bg-muted rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        ride.plataforma === 'uber' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary text-secondary-foreground'
                      }`}>
                        {ride.plataforma === 'uber' ? 'Uber' : '99'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {new Date(ride.data_hora).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-success" />
                        <span className="font-medium">R$ {ride.valor.toFixed(2)}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRide(ride.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                    <div><span className="font-medium">Viagens:</span> {ride.numero_viagens}</div>
                    <div><span className="font-medium">KM:</span> {ride.km_rodados}</div>
                    <div><span className="font-medium">Consumo:</span> {ride.consumo_km_l} km/l</div>
                    <div><span className="font-medium">Tempo:</span> {ride.tempo_trabalhado}min</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};