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
  horario: string;
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
    horario: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchRides = async () => {
    try {
      setLoading(true);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      // First, get the daily entry for the selected date
      const { data: entrada } = await supabase
        .from('entradas_diarias')
        .select('id')
        .eq('user_id', user.id)
        .eq('data', selectedDate)
        .single();

      if (!entrada) {
        setRides([]);
        return;
      }

      // Then get the individual rides for this daily entry
      const { data: corridasData, error } = await supabase
        .from('corridas_individuais')
        .select('*')
        .eq('user_id', user.id)
        .eq('entrada_diaria_id', entrada.id)
        .order('horario', { ascending: true });

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
    if (!newRide.plataforma || !newRide.valor || !newRide.horario) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos."
      });
      return;
    }

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      // Get or create daily entry
      let { data: entrada, error: entradaError } = await supabase
        .from('entradas_diarias')
        .select('id')
        .eq('user_id', user.id)
        .eq('data', selectedDate)
        .single();

      if (entradaError && entradaError.code === 'PGRST116') {
        // Create new daily entry if it doesn't exist
        const { data: newEntrada, error: createError } = await supabase
          .from('entradas_diarias')
          .insert({
            data: selectedDate,
            ganhos_uber: 0,
            ganhos_99: 0,
            km_rodados: 0,
            tempo_trabalhado: 0,
            consumo_km_l: 0,
            user_id: user.id
          })
          .select('id')
          .single();

        if (createError) throw createError;
        entrada = newEntrada;
      } else if (entradaError) {
        throw entradaError;
      }

      // Add the individual ride
      const { error: rideError } = await supabase
        .from('corridas_individuais')
        .insert({
          entrada_diaria_id: entrada.id,
          plataforma: newRide.plataforma,
          valor: newRide.valor,
          horario: newRide.horario,
          user_id: user.id
        });

      if (rideError) throw rideError;

      // Update daily totals
      await updateDailyTotals(entrada.id);

      setNewRide({ plataforma: '', valor: 0, horario: '' });
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

      // Get the daily entry ID before deleting the ride
      const { data: rideData } = await supabase
        .from('corridas_individuais')
        .select('entrada_diaria_id')
        .eq('id', rideId)
        .eq('user_id', user.id)
        .single();

      if (!rideData) return;

      // Delete the ride
      const { error } = await supabase
        .from('corridas_individuais')
        .delete()
        .eq('id', rideId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update daily totals
      await updateDailyTotals(rideData.entrada_diaria_id);

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

  const updateDailyTotals = async (entradaDiariaId: number) => {
    try {
      // Get all rides for this daily entry
      const { data: allRides } = await supabase
        .from('corridas_individuais')
        .select('plataforma, valor')
        .eq('entrada_diaria_id', entradaDiariaId);

      if (!allRides) return;

      const uberTotal = allRides
        .filter(ride => ride.plataforma === 'uber')
        .reduce((sum, ride) => sum + ride.valor, 0);

      const nineNineTotal = allRides
        .filter(ride => ride.plataforma === '99')
        .reduce((sum, ride) => sum + ride.valor, 0);

      // Update the daily entry totals
      await supabase
        .from('entradas_diarias')
        .update({
          ganhos_uber: uberTotal,
          ganhos_99: nineNineTotal
        })
        .eq('id', entradaDiariaId);
    } catch (error) {
      console.error('Error updating daily totals:', error);
    }
  };

  const getDailySummary = (): DailySummary => {
    const uberTotal = rides.filter(r => r.plataforma === 'uber').reduce((sum, r) => sum + r.valor, 0);
    const nineNineTotal = rides.filter(r => r.plataforma === '99').reduce((sum, r) => sum + r.valor, 0);
    
    return {
      uberTotal,
      nineNineTotal,
      totalRides: rides.length,
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newRide.valor || ''}
                onChange={(e) => setNewRide(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Horário</Label>
              <Input
                type="time"
                value={newRide.horario}
                onChange={(e) => setNewRide(prev => ({ ...prev, horario: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addRide} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
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
                <div key={ride.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="flex items-center gap-4">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      ride.plataforma === 'uber' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {ride.plataforma === 'uber' ? 'Uber' : '99'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{ride.horario}</span>
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};