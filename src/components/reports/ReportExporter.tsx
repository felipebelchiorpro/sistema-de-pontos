
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Partner, Transaction } from "@/types";
import { TransactionType } from "@/types";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2 } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY?: number;
    };
  }
}

interface ReportExporterProps {
  summaryCardsData: Array<{ title: string; value: string }>;
  partnersData: Array<{ partner: Partner; transactions: Transaction[] }>;
}

export function ReportExporter({ summaryCardsData, partnersData }: ReportExporterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generatePdf = () => {
    setIsLoading(true);
    try {
      const doc = new jsPDF();
      let yPos = 15;

      doc.setFontSize(18);
      doc.text("Relatório de Pontos - DARKSTORE PONTOS", 14, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.text(`Data de Geração: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, yPos);
      yPos += 10;

      doc.setFontSize(14);
      doc.text("Resumo Geral do Programa", 14, yPos);
      yPos += 7;
      doc.setFontSize(10);
      summaryCardsData.forEach(card => {
        doc.text(`${card.title}: ${card.value}`, 14, yPos);
        yPos += 6;
      });
<<<<<<< HEAD
      yPos += 4; 
=======
      yPos += 4;
>>>>>>> 78b646e (feat: migrate backend to PocketBase and update UI to premium dark theme)

      doc.setFontSize(14);
      doc.text("Detalhes dos Parceiros", 14, yPos);
      yPos += 7;

      partnersData.forEach(({ partner, transactions }) => {
<<<<<<< HEAD
        if (yPos > 250) { 
          doc.addPage();
          yPos = 15; 
=======
        // Need to check position before adding partner info to avoid splitting header and table
        if (yPos > 250) {
          doc.addPage();
          yPos = 15;
>>>>>>> 78b646e (feat: migrate backend to PocketBase and update UI to premium dark theme)
          doc.setFontSize(14);
          doc.text("Detalhes dos Parceiros (Continuação)", 14, yPos);
          yPos += 7;
        }
        doc.setFontSize(12);
<<<<<<< HEAD
        doc.setFont(undefined, 'bold');
        doc.text(`${partner.name} (Cupom: ${partner.coupon})`, 14, yPos);
        yPos += 6;
        
        doc.setFont(undefined, 'normal');
=======
        doc.setFont('helvetica', 'bold');
        doc.text(`${partner.name} (Cupom: ${partner.coupon})`, 14, yPos);
        yPos += 6;

        doc.setFont('helvetica', 'normal');
>>>>>>> 78b646e (feat: migrate backend to PocketBase and update UI to premium dark theme)
        doc.setFontSize(10);
        doc.text(`Pontos Atuais: ${partner.points.toFixed(2)} pts`, 14, yPos);
        yPos += 6;

        if (transactions.length > 0) {
<<<<<<< HEAD
          (doc as any).autoTable({
=======
          // @ts-ignore - jspdf-autotable extends jsPDF but types are sometimes tricky
          doc.autoTable({
>>>>>>> 78b646e (feat: migrate backend to PocketBase and update UI to premium dark theme)
            startY: yPos,
            head: [['Data', 'Tipo', 'ID Venda Ext.', 'Valor Venda (Orig.)', 'Pontos']],
            body: transactions.map(t => {
              const date = parseISO(t.date);
              const formattedDate = isValid(date) ? format(date, "dd/MM/yy HH:mm", { locale: ptBR }) : "Data inválida";
<<<<<<< HEAD
              
=======

>>>>>>> 78b646e (feat: migrate backend to PocketBase and update UI to premium dark theme)
              return [
                formattedDate,
                t.type,
                t.externalSaleId || 'N/A',
                typeof t.originalSaleValue === 'number' ? `R$ ${t.originalSaleValue.toFixed(2)}` : 'N/A',
                `${t.type === TransactionType.SALE ? '+' : '-'}${t.amount.toFixed(2)}`
              ];
            }),
            theme: 'striped',
            headStyles: { fillColor: [40, 40, 40] },
            styles: { fontSize: 8 },
            columnStyles: {
<<<<<<< HEAD
              0: { cellWidth: 25 }, 
              1: { cellWidth: 20 }, 
              2: { cellWidth: 30 }, 
              3: { cellWidth: 35 }, 
=======
              0: { cellWidth: 25 },
              1: { cellWidth: 20 },
              2: { cellWidth: 30 },
              3: { cellWidth: 35 },
>>>>>>> 78b646e (feat: migrate backend to PocketBase and update UI to premium dark theme)
              4: { cellWidth: 20, halign: 'right' },
            },
            margin: { left: 14, right: 14 },
          });
<<<<<<< HEAD
          yPos = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 5 : yPos + 5;
=======
          yPos = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 5 : yPos + 5;
>>>>>>> 78b646e (feat: migrate backend to PocketBase and update UI to premium dark theme)
        } else {
          doc.text("Nenhuma transação para este parceiro.", 14, yPos);
          yPos += 6;
        }
<<<<<<< HEAD
        yPos += 4; 
=======
        yPos += 4;
>>>>>>> 78b646e (feat: migrate backend to PocketBase and update UI to premium dark theme)
      });

      doc.save("relatorio_darkstore_pontos.pdf");
      toast({ title: "Sucesso", description: "Relatório geral em PDF gerado." });

    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast({ title: "Erro", description: "Não foi possível gerar o relatório em PDF.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={generatePdf} variant="outline" disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Exportar Relatório Geral
        </>
      )}
    </Button>
  );
}
