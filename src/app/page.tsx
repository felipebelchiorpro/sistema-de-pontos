
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, ShoppingCart, Gift, TrendingUp, Award } from "lucide-react";
import Link from "next/link";
import { getPartners, getAllTransactionsWithPartnerDetails } from "@/lib/mock-data";
import { TransactionType } from "@/types";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { TopPartnersChart } from "@/components/dashboard/TopPartnersChart";

export default async function DashboardPage() {
  const [partnersResult, transactionsResult] = await Promise.all([
    getPartners(),
    getAllTransactionsWithPartnerDetails()
  ]);

  const partners = partnersResult.partners || [];
  const transactions = transactionsResult.transactions || [];

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
    { title: "Total de Parceiros", value: totalPartners, icon: Users, color: "text-primary", href:"/partners" },
    { title: "Vendas Totais (Valor Bruto)", value: `R$ ${totalSalesValue.toFixed(2)}`, icon: ShoppingCart, color: "text-chart-4", href:"/sales" },
    { title: "Total Pontos Gerados", value: totalPointsGenerated.toFixed(2), icon: BarChart3, color: "text-chart-3", href:"/reports" },
    { title: "Total Pontos Resgatados", value: totalPointsRedeemed.toFixed(2), icon: Gift, color: "text-destructive", href:"/redemptions" },
  ];

  // DATA FOR CHARTS
  // 1. Sales over last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const salesByDay = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0,0,0,0);
    const dateString = d.toISOString().split('T')[0];
    salesByDay.set(dateString, 0);
  }
  
  (transactions || [])
    .filter(t => t.type === TransactionType.SALE && new Date(t.date) >= thirtyDaysAgo)
    .forEach(t => {
      const dateString = new Date(t.date).toISOString().split('T')[0];
      salesByDay.set(dateString, (salesByDay.get(dateString) || 0) + (t.originalSaleValue || 0));
    });

  const salesChartData = Array.from(salesByDay.entries())
    .map(([date, total]) => ({
      date: new Date(date + 'T12:00:00Z').toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      total,
      fullDate: date,
    }))
    .sort((a,b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

  // 2. Top 5 partners by points
  const topPartners = [...partners]
    .sort((a, b) => b.points - a.points)
    .slice(0, 5)
    .filter(p => p.points > 0);

  const topPartnersChartData = topPartners.map((p, index) => ({
    name: p.name,
    value: p.points,
    fill: `hsl(var(--chart-${index + 1}))`,
  }));


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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Vendas nos Últimos 30 Dias
            </CardTitle>
            <CardDescription>
              Volume de vendas diário registrado no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SalesChart data={salesChartData} />
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" /> Top 5 Parceiros por Pontos
            </CardTitle>
            <CardDescription>
              Parceiros com as maiores pontuações atualmente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopPartnersChart data={topPartnersChartData} />
          </CardContent>
        </Card>
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
                  <div className={`font-semibold ${transaction.type === TransactionType.SALE ? 'text-chart-4' : 'text-destructive'}`}>
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

