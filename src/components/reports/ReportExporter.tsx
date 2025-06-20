
"use client";

import { Button } from "@/components/ui/button";
import type { Partner, Transaction } from "@/types";
import { TransactionType } from "@/types";
import jsPDF from "jspdf";
import "jspdf-autotable"; // Augments jsPDF.prototype

// This explicit type augmentation can be moved to a global d.ts file if preferred
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY?: number;
      // other properties can be added if needed
    };
  }
}

interface ReportExporterProps {
  summaryCardsData: Array<{ title: string; value: string }>;
  partnersData: Array<{ partner: Partner; transactions: Transaction[] }>;
}

export function ReportExporter({ summaryCardsData, partnersData }: ReportExporterProps) {
  const generatePdf = () => {
    const doc = new jsPDF();
    let yPos = 15;

    doc.setFontSize(18);
    doc.text("Relatório de Parcerias - DarkStore Suplementos", 14, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, 14, yPos);
    yPos += 10;

    doc.setFontSize(14);
    doc.text("Resumo Geral do Programa", 14, yPos);
    yPos += 7;
    doc.setFontSize(10);
    summaryCardsData.forEach(card => {
      doc.text(`${card.title}: ${card.value}`, 14, yPos);
      yPos += 6;
    });
    yPos += 4; 

    doc.setFontSize(14);
    doc.text("Detalhes dos Parceiros", 14, yPos);
    yPos += 7;

    partnersData.forEach(({ partner, transactions }) => {
      if (yPos > 250) { 
        doc.addPage();
        yPos = 15; 
        doc.setFontSize(14); // Re-set font size for title on new page if needed
        doc.text("Detalhes dos Parceiros (Continuação)", 14, yPos);
        yPos += 7;
      }
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`${partner.name} (Cupom: ${partner.coupon})`, 14, yPos);
      yPos += 6;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Pontos Atuais: ${partner.points.toFixed(2)} pts`, 14, yPos);
      yPos += 6;

      if (transactions.length > 0) {
        (doc as any).autoTable({ // Use 'as any' if type augmentation is problematic in this context
          startY: yPos,
          head: [['Data', 'Tipo', 'ID Venda Ext.', 'Valor Venda (Orig.)', 'Pontos']],
          body: transactions.map(t => [
            new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            t.type,
            t.externalSaleId || 'N/A',
            t.originalSaleValue ? `R$ ${t.originalSaleValue.toFixed(2)}` : 'N/A',
            `${t.type === TransactionType.SALE ? '+' : '-'}${t.amount.toFixed(2)}`
          ]),
          theme: 'striped',
          headStyles: { fillColor: [22, 160, 133] }, // Dark cyan for header
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 35 }, // Data
            1: { cellWidth: 20 }, // Tipo
            2: { cellWidth: 30 }, // ID Venda Ext.
            3: { cellWidth: 40 }, // Valor Venda
            4: { cellWidth: 20, halign: 'right' }, // Pontos
          },
          margin: { left: 14, right: 14 },
          didDrawPage: (data: any) => { 
             // yPos = data.cursor?.y ?? yPos; // This is updated by lastAutoTable.finalY
          }
        });
        yPos = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 5 : yPos + 5;
      } else {
        doc.text("Nenhuma transação para este parceiro.", 14, yPos);
        yPos += 6;
      }
      yPos += 4; 
    });

    doc.save("relatorio_parceiros.pdf");
  };

  return (
    <Button onClick={generatePdf} variant="outline">
      Exportar para PDF
    </Button>
  );
}

