
"use client";

import * as React from "react";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Download, Loader2, User, CalendarDays } from "lucide-react";

import type { Partner, Transaction } from "@/types";
import { TransactionType } from "@/types";
import { fetchIndividualPartnerReportDataAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker"; // Assuming you created this
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";


declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY?: number;
    };
  }
}

interface IndividualReportControlsProps {
  partners: Partner[];
}

export function IndividualReportControls({ partners }: IndividualReportControlsProps) {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    if (!selectedPartnerId) {
      toast({ title: "Erro", description: "Por favor, selecione um parceiro.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const result = await fetchIndividualPartnerReportDataAction(
      selectedPartnerId,
      startDate?.toISOString(),
      endDate?.toISOString()
    );
    setIsLoading(false);

    if (result.error) {
      toast({ title: "Erro ao buscar dados", description: result.error, variant: "destructive" });
      return;
    }
    
    if (result && result.partner && result.transactions) {
        if (result.transactions.length === 0) {
           toast({ title: "Atenção", description: "Nenhuma transação encontrada para este parceiro no período selecionado.", variant: "default" });
           return;
        }
        generateIndividualPdf(result.partner, result.transactions, startDate, endDate);
        toast({ title: "Sucesso", description: "Relatório PDF gerado." });
    }
  };

  const generateIndividualPdf = (partner: Partner, transactions: Transaction[], sDate?: Date, eDate?: Date) => {
    const doc = new jsPDF();
    let yPos = 15;

    doc.setFontSize(16);
    doc.text(`Relatório Individual - ${partner.name} (${partner.coupon})`, 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.text(`Pontos Atuais: ${partner.points.toFixed(2)} pts`, 14, yPos);
    yPos += 6;
    
    let period = "Todo o período";
    if (sDate && eDate) {
      period = `Período: ${format(sDate, "dd/MM/yyyy", { locale: ptBR })} - ${format(eDate, "dd/MM/yyyy", { locale: ptBR })}`;
    } else if (sDate) {
      period = `Período: A partir de ${format(sDate, "dd/MM/yyyy", { locale: ptBR })}`;
    } else if (eDate) {
      period = `Período: Até ${format(eDate, "dd/MM/yyyy", { locale: ptBR })}`;
    }
    doc.text(period, 14, yPos);
    yPos += 8;
    
    doc.text(`Data de Geração: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, yPos);
    yPos += 10;


    if (transactions.length > 0) {
      (doc as any).autoTable({
        startY: yPos,
        head: [['Data', 'Tipo', 'ID Venda Ext.', 'Valor Venda (Orig.)', 'Pontos']],
        body: transactions.map(t => [
          format(parseISO(t.date), "dd/MM/yy HH:mm", { locale: ptBR }),
          t.type,
          t.externalSaleId || 'N/A',
          t.originalSaleValue ? `R$ ${t.originalSaleValue.toFixed(2)}` : 'N/A',
          `${t.type === TransactionType.SALE ? '+' : '-'}${t.amount.toFixed(2)}`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [22, 160, 133] },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 25 }, 
          1: { cellWidth: 20 }, 
          2: { cellWidth: 30 }, 
          3: { cellWidth: 35 }, 
          4: { cellWidth: 20, halign: 'right' },
        },
        margin: { left: 14, right: 14 },
      });
    } else {
      doc.text("Nenhuma transação encontrada para este parceiro no período selecionado.", 14, yPos);
    }

    doc.save(`relatorio_${partner.coupon}_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  return (
    <Card className="bg-card mt-8">
      <CardHeader>
        <CardTitle>Gerar Relatório Individual</CardTitle>
        <CardDescription>Selecione um parceiro e um período para gerar um relatório PDF específico.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="partner-select">Parceiro (Influencer)</Label>
          <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
            <SelectTrigger id="partner-select" className="w-full bg-input">
              <SelectValue placeholder="Selecione um parceiro" />
            </SelectTrigger>
            <SelectContent>
              {partners.map((partner) => (
                <SelectItem key={partner.id} value={partner.id}>
                  {partner.name} ({partner.coupon})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Data de Início</Label>
            <DatePicker date={startDate} setDate={setStartDate} placeholder="Opcional" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">Data de Fim</Label>
            <DatePicker date={endDate} setDate={setEndDate} placeholder="Opcional" />
          </div>
        </div>
        
        <Button onClick={handleGenerateReport} disabled={isLoading || !selectedPartnerId} className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Gerar Relatório PDF Individual
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
