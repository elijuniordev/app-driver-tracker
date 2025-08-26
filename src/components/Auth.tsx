import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export const AuthComponent = () => {
  const { toast } = useToast();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN') {
          // Lógica para quando o usuário faz login
        }
        if (event === 'SIGNED_OUT') {
          // Lógica para quando o usuário faz logout
        }
      }
    );

    // Adiciona um listener para erros de autenticação via URL (ex: links mágicos)
    const handleAuthError = () => {
      const hash = window.location.hash;
      if (hash.includes('error_description')) {
        const params = new URLSearchParams(hash.substring(1)); // remove '#'
        const errorDescription = params.get('error_description');
        if (errorDescription) {
            toast({
                variant: "destructive",
                title: "Erro de Autenticação",
                description: decodeURIComponent(errorDescription.replace(/\+/g, ' ')),
            });
            // Limpa a URL para não mostrar o erro novamente
            window.history.replaceState(null, '', window.location.pathname);
        }
      }
    };
    
    handleAuthError();
    window.addEventListener('hashchange', handleAuthError);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('hashchange', handleAuthError);
    };
  }, [toast]);


  const handlePasswordReset = async (email: string) => {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
        if (error) throw error;
        toast({
            title: "Verifique seu e-mail",
            description: "Um link para redefinir sua senha foi enviado.",
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
        toast({
            variant: "destructive",
            title: "Erro ao redefinir senha",
            description: errorMessage,
        });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Driver Tracker</CardTitle>
          <CardDescription>Acesse sua conta para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            theme="dark"
            providers={['google']}
            localization={{
                variables: {
                    sign_in: {
                        email_label: 'Seu e-mail',
                        password_label: 'Sua senha',
                        button_label: 'Entrar',
                        social_provider_text: 'Entrar com {{provider}}',
                        link_text: 'Já tem uma conta? Entre',
                    },
                    sign_up: {
                        email_label: 'Seu e-mail',
                        password_label: 'Crie uma senha',
                        button_label: 'Criar conta',
                        social_provider_text: 'Entrar com {{provider}}',
                        link_text: 'Não tem uma conta? Crie uma',
                    },
                    forgotten_password: {
                        email_label: 'Seu e-mail',
                        button_label: 'Enviar instruções',
                        link_text: 'Esqueceu sua senha?',
                    },
                    update_password: {
                        password_label: 'Nova senha',
                        button_label: 'Atualizar senha',
                    },
                },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};