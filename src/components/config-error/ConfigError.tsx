
import { AlertTriangle, Terminal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ConfigErrorProps {
  message: string;
}

export function ConfigError({ message }: ConfigErrorProps) {
  const isSupabaseError = message.toLowerCase().includes('supabase');

  return (
    <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-3xl bg-destructive/10 border-destructive">
            <CardHeader className="text-center">
                <div className="mx-auto bg-destructive/20 rounded-full p-3 w-fit">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle className="text-destructive mt-4 text-2xl">
                    Erro de Configuração do Backend
                </CardTitle>
                <CardDescription className="text-destructive/80">
                    A aplicação não conseguiu se conectar ou interagir corretamente com o banco de dados Supabase.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-destructive/10 p-4 rounded-md text-left">
                    <p className="text-sm font-semibold text-foreground mb-2 flex items-center"><Terminal className="mr-2 h-4 w-4"/> Mensagem de Erro:</p>
                    <p className="text-sm text-foreground font-mono">{message}</p>
                </div>
                
                <div className="text-left space-y-4 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">Como resolver? Siga estes passos:</p>
                    <ol className="list-decimal list-inside space-y-3">
                        <li>
                            <span className="font-medium text-foreground">Verifique as Variáveis de Ambiente na Vercel:</span><br/>
                            Acesse seu projeto na Vercel, vá em `Settings` {'>'} `Environment Variables` e confirme se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` existem e estão com os valores corretos.
                        </li>
                        <li>
                            <span className="font-medium text-foreground">Faça "Redeploy":</span><br/>
                             Após qualquer alteração nas variáveis, é <strong>obrigatório</strong> fazer um "Redeploy" na Vercel para que as mudanças tenham efeito.
                        </li>
                        <li>
                             <span className="font-medium text-foreground">Verifique o Schema do Supabase:</span><br/>
                             Confirme se você executou os scripts SQL no seu `SQL Editor` do Supabase para criar as tabelas (`partners_v2`, `transactions_v2`) e as funções (`register_sale`, `redeem_points`).
                        </li>
                         <li>
                             <span className="font-medium text-foreground">Execute o Teste de Diagnóstico:</span><br/>
                             A página de Configurações possui uma ferramenta para um teste mais detalhado da conexão.
                        </li>
                    </ol>
                </div>
                
                <div className="flex justify-center gap-4">
                    <Button asChild variant="destructive">
                        <a 
                            href="https://vercel.com/dashboard" 
                            target="_blank" 
                            rel="noopener noreferrer"
                        >
                            Ir para o Dashboard da Vercel
                        </a>
                    </Button>
                    <Button asChild variant="secondary">
                        <Link href="/settings">
                            Ir para a Página de Diagnóstico
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
