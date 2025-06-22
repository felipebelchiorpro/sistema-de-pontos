
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllTransactionsWithPartnerDetails, getPartners } from "@/lib/mock-data";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { ConfigError } from "@/components/config-error/ConfigError";

export default async function TransactionsPage() {
  const [transactionsResult, partnersResult] = await Promise.all([
    getAllTransactionsWithPartnerDetails(),
    getPartners()
  ]);

  if (transactionsResult.error || partnersResult.error) {
    const errorMessage = transactionsResult.error || partnersResult.error || "Ocorreu um erro desconhecido ao carregar os dados.";
    return <ConfigError message={errorMessage} />;
  }

  const transactions = transactionsResult.transactions || [];
  const partners = partnersResult.partners || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Histórico de Transações</h1>
        <p className="text-muted-foreground">Visualize, edite ou exclua todas as transações registradas no sistema.</p>
      </div>
      
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Lista de Transações</CardTitle>
          <CardDescription>Detalhes de todas as vendas e resgates.</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionsTable transactions={transactions} partners={partners} />
        </CardContent>
      </Card>
    </div>
  );
}
