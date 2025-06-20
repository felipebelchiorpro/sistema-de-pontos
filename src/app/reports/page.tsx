
import { getPartners, getTransactionsForPartner, getAllTransactionsWithPartnerDetails } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PartnerTransactionsTable } from "@/components/reports/PartnerTransactionsTable";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Award, Coins, ArrowUpCircle, ArrowDownCircle, Scale } from "lucide-react";
import { TransactionType } from "@/types";

export default async function ReportsPage() {
  const partners = await getPartners();
  const allTransactions = await getAllTransactionsWithPartnerDetails();
  
  // Sort partners by points descending for a ranked view
  const sortedPartners = [...partners].sort((a, b) => b.points - a.points);

  const totalPointsInHand = partners.reduce((sum, p) => sum + p.points, 0);
  const totalPointsGeneratedFromSales = allTransactions
    .filter(t => t.type === TransactionType.SALE)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalPointsRedeemedOverall = allTransactions
    .filter(t => t.type === TransactionType.REDEMPTION)
    .reduce((sum, t) => sum + t.amount, 0);
  const pointsBalance = totalPointsGeneratedFromSales - totalPointsRedeemedOverall;

  const summaryCards = [
    { title: "Total de Pontos (em mãos)", value: totalPointsInHand.toFixed(2) + " pts", icon: Coins, color: "text-yellow-400" },
    { title: "Total Pontos Gerados (Vendas)", value: totalPointsGeneratedFromSales.toFixed(2) + " pts", icon: ArrowUpCircle, color: "text-green-400" },
    { title: "Total Pontos Resgatados", value: totalPointsRedeemedOverall.toFixed(2) + " pts", icon: ArrowDownCircle, color: "text-red-400" },
    { title: "Saldo de Pontos (Gerados - Resgatados)", value: pointsBalance.toFixed(2) + " pts", icon: Scale, color: pointsBalance >= 0 ? "text-blue-400" : "text-red-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Relatório de Pontos dos Parceiros</h1>
        <p className="text-muted-foreground">Visualize os totais de pontos do programa e o histórico de transações de cada parceiro.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="bg-card">
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
        ))}
      </div>

      {sortedPartners.length > 0 ? (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Detalhes dos Parceiros</CardTitle>
            <CardDescription>Clique em um parceiro para ver seu histórico de transações e saldo individual.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {await Promise.all(sortedPartners.map(async (partner, index) => {
                const transactions = await getTransactionsForPartner(partner.id);
                return (
                  <AccordionItem value={`partner-${partner.id}`} key={partner.id} className="border-b border-border last:border-b-0">
                    <AccordionTrigger className="hover:bg-secondary/30 px-4 py-3 rounded-t-md data-[state=open]:bg-secondary/40 data-[state=open]:rounded-b-none transition-colors">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <UserCircle className="h-6 w-6 text-primary" />
                          <div>
                            <span className="font-medium text-foreground">{partner.name}</span>
                            <Badge variant="secondary" className="ml-2 font-mono bg-primary/20 text-primary-foreground hover:bg-primary/30">{partner.coupon}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-right">
                           {index < 3 && ( 
                            <Award className={`h-5 w-5 ${
                                index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-400' : 'text-orange-400'
                            }`} />
                           )}
                          <span className="font-semibold text-lg text-primary">{partner.points.toFixed(2)} pts</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 py-3 bg-background">
                      <PartnerTransactionsTable transactions={transactions} />
                    </AccordionContent>
                  </AccordionItem>
                );
              }))}
            </Accordion>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Detalhes dos Parceiros</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">Nenhum parceiro encontrado para exibir no relatório.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
