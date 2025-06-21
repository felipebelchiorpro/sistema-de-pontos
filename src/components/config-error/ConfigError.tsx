import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ConfigErrorProps {
  message: string;
}

export function ConfigError({ message }: ConfigErrorProps) {
  const isSupabaseError = message.toLowerCase().includes('supabase');

  return (
    <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-2xl bg-destructive/10 border-destructive">
            <CardHeader className="text-center">
                <div className="mx-auto bg-destructive/20 rounded-full p-3 w-fit">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle className="text-destructive mt-4 text-2xl">
                    Erro de Configuração do Backend
                </CardTitle>
                <CardDescription className="text-destructive/80">
                    A aplicação não conseguiu se conectar ao banco de dados Supabase.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <div className="bg-destructive/10 p-4 rounded-md mb-6">
                    <p className="text-sm text-foreground font-mono">{message}</p>
                </div>
                <p className="text-muted-foreground mb-4">
                    Isso acontece porque as variáveis de ambiente do Supabase não foram configuradas no seu projeto Vercel. Siga o passo a passo para adicioná-las.
                </p>
                <Button asChild variant="destructive">
                    <a 
                        href="https://vercel.com/dashboard" 
                        target="_blank" 
                        rel="noopener noreferrer"
                    >
                        Ir para o Dashboard da Vercel
                    </a>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
