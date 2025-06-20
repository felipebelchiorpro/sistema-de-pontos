import { getPartners, getTransactionsForPartner } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PartnerTransactionsTable } from "@/components/reports/PartnerTransactionsTable";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Award } from "lucide-react";

export default async function ReportsPage() {
  const partners = await getPartners();
  
  // Sort partners by points descending for a ranked view
  const sortedPartners = [...partners].sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Relatório de Pontos dos Parceiros</h1>
        <p className="text-muted-foreground">Visualize os pontos acumulados e o histórico de transações de cada parceiro.</p>
      </div>

      {sortedPartners.length > 0 ? (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Detalhes dos Parceiros</CardTitle>
            <CardDescription>Clique em um parceiro para ver seu histórico de transações.</CardDescription>
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
                           {index < 3 && ( // Display medal for top 3
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
            <CardTitle>Relatório de Pontos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">Nenhum parceiro encontrado para exibir no relatório.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
