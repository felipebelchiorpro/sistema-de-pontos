"use client";

import { useState } from "react";
import { testFirebaseConnectionAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

interface TestResult {
  success: boolean;
  message: string;
}

export function FirebaseTest() {
  const [result, setResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTestConnection = async () => {
    setIsLoading(true);
    setResult(null);
    const testResult = await testFirebaseConnectionAction();
    setResult(testResult);
    setIsLoading(false);
  };

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Teste de Conexão com Firebase</CardTitle>
        <CardDescription>
          Clique no botão abaixo para verificar se a aplicação consegue se conectar ao seu banco de dados Firebase. 
          Isso ajuda a confirmar se as suas variáveis de ambiente na Vercel estão corretas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button onClick={handleTestConnection} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testando...
            </>
          ) : (
            "Testar Conexão com Firebase"
          )}
        </Button>
        
        {result && (
          <Alert variant={result.success ? "default" : "destructive"} className={result.success ? "border-green-500/50 bg-green-500/10 text-foreground" : ""}>
            {result.success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4" />}
            <AlertTitle className={result.success ? "text-green-400" : ""}>
                {result.success ? "Sucesso na Conexão" : "Falha na Conexão"}
            </AlertTitle>
            <AlertDescription className="font-mono text-xs mt-2">
              {result.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
