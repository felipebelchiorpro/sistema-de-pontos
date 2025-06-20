import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, ShoppingCart, Gift } from "lucide-react";
import Link from "next/link";
import { getPartners, getAllTransactionsWithPartnerDetails } from "@/lib/mock-data";
import { TransactionType } from "@/types";

export default async function DashboardPage() {
  const partners = await getPartners();
  const transactions = await getAllTransactionsWithPartnerDetails();

  const totalPartners = partners.length;
  const totalSalesValue = transactions
    .filter(t => t.type === TransactionType.SALE && t.originalSaleValue)
    .reduce((sum, t) => sum + (t.originalSaleValue || 0), 0);
  const totalPointsGenerated = transactions
    .filter(t => t.type === TransactionType.SALE)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalPointsRedeemed = transactions
    .filter(t => t.type === TransactionType.REDEMPTION)
    .reduce((sum, t) => sum + t.amount, 0);


  const statCards = [
    { title: "Total de Parceiros", value: totalPartners, icon: Users, color: "text-blue-400", href:"/partners" },
    { title: "Vendas Totais (Valor Bruto)", value: `R$ ${totalSalesValue.toFixed(2)}`, icon: ShoppingCart, color: "text-green-400", href:"/sales" },
    { title: "Total Pontos Gerados", value: totalPointsGenerated.toFixed(2), icon: BarChart3, color: "text-yellow-400", href:"/reports" },
    { title: "Total Pontos Resgatados", value: totalPointsRedeemed.toFixed(2), icon: Gift, color: "text-red-400", href:"/redemptions" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link href={card.href} key={card.title}>
            <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer bg-card hover:bg-secondary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>Últimas 5 transações registradas no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <ul className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <li key={transaction.id} className="flex justify-between items-center p-3 rounded-md bg-secondary/30">
                  <div>
                    <p className="font-medium text-foreground">{transaction.partnerName} ({transaction.partnerCoupon})</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString('pt-BR')} - {transaction.type}
                    </p>
                  </div>
                  <div className={`font-semibold ${transaction.type === TransactionType.SALE ? 'text-green-400' : 'text-red-400'}`}>
                    {transaction.type === TransactionType.SALE ? '+' : '-'}{transaction.amount.toFixed(2)} pts
                    {transaction.type === TransactionType.SALE && transaction.originalSaleValue && (
                       <span className="text-xs text-muted-foreground ml-2">
                         (Venda: R$ {transaction.originalSaleValue.toFixed(2)}
                         {transaction.externalSaleId && `, ID Ext: ${transaction.externalSaleId}`})
                       </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Nenhuma transação recente.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
