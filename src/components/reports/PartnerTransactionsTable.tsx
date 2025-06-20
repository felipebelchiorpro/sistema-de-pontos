import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/types";
import { TransactionType } from "@/types";

interface PartnerTransactionsTableProps {
  transactions: Transaction[];
}

export function PartnerTransactionsTable({ transactions }: PartnerTransactionsTableProps) {
  if (transactions.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">Nenhuma transação para este parceiro.</p>;
  }

  return (
    <div className="overflow-x-auto mt-2 border rounded-md bg-secondary/30">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Valor Venda (Original)</TableHead>
            <TableHead className="text-right">Pontos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="text-muted-foreground text-xs">
                {new Date(transaction.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </TableCell>
              <TableCell>
                <Badge variant={transaction.type === TransactionType.SALE ? "default" : "destructive"} className={transaction.type === TransactionType.SALE ? "bg-green-600/80 hover:bg-green-500/80" : "bg-red-600/80 hover:bg-red-500/80"}>
                  {transaction.type}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {transaction.type === TransactionType.SALE && transaction.originalSaleValue
                  ? `R$ ${transaction.originalSaleValue.toFixed(2)}`
                  : "N/A"}
              </TableCell>
              <TableCell className={`text-right font-semibold ${transaction.type === TransactionType.SALE ? 'text-green-400' : 'text-red-400'}`}>
                {transaction.type === TransactionType.SALE ? '+' : '-'}{transaction.amount.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
