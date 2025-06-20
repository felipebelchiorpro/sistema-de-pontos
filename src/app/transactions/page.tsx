
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllTransactionsWithPartnerDetails } from "@/lib/mock-data";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";

export default async function TransactionsPage() {
  const transactions = await getAllTransactionsWithPartnerDetails();

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
          <Suspense fallback={<TransactionsTableSkeleton />}>
            <TransactionsTable transactions={transactions} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function TransactionsTableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex justify-between items-center p-3 rounded-md bg-secondary/30">
          <div className="space-y-1 w-1/4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="space-y-1 w-1/4">
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="space-y-1 w-1/4">
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="space-y-1 w-1/4 text-right">
            <Skeleton className="h-5 w-16 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}
