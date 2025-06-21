
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllTransactionsWithPartnerDetails } from "@/lib/mock-data";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";

export default async function TransactionsPage() {
  const result = await getAllTransactionsWithPartnerDetails();
  const transactions = result.transactions || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Histórico de Transações</h1>
        <p className="text-muted-foreground">Visualize todas as transações registradas no sistema.</p>
      </div>
      
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Lista de Transações</CardTitle>
          <CardDescription>Detalhes de todas as vendas e resgates.</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionsTable transactions={transactions} />
        </CardContent>
      </Card>
    </div>
  );
}
