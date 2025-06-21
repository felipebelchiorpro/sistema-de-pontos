
import { AlertTriangle, Terminal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ConfigErrorProps {
  message: string;
}

export function ConfigError({ message }: ConfigErrorProps) {
  return (
    <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-2xl bg-destructive/10 border-destructive">
            <CardHeader className="text-center">
                <div className="mx-auto bg-destructive/20 rounded-full p-3 w-fit">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle className="text-destructive mt-4 text-2xl">
                    Erro de Conexão com o Backend
                </CardTitle>
                <CardDescription className="text-destructive/80">
                    A aplicação não conseguiu buscar os dados necessários para renderizar esta página.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-destructive/10 p-4 rounded-md text-left">
                    <p className="text-sm font-semibold text-foreground mb-2 flex items-center"><Terminal className="mr-2 h-4 w-4"/> Mensagem Técnica:</p>
                    <p className="text-sm text-foreground font-mono">{message}</p>
                </div>
                
                <div className="text-center text-sm text-muted-foreground">
                    <p>Se o problema persistir, use a ferramenta de diagnóstico para mais detalhes.</p>
                </div>
                
                <div className="flex justify-center">
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
