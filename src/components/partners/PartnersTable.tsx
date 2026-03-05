import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Partner } from "@/types";
import { Badge } from "@/components/ui/badge";

export function PartnersTable({ partners }: { partners: Partner[] }) {
  return (
<<<<<<< HEAD
    <Card className="bg-card">
=======
    <Card className="bg-card/40 backdrop-blur-md border-white/5 shadow-xl">
>>>>>>> 78b646e (feat: migrate backend to PocketBase and update UI to premium dark theme)
      <CardHeader>
        <CardTitle>Lista de Parceiros</CardTitle>
        <CardDescription>Parceiros cadastrados no sistema e seus pontos acumulados.</CardDescription>
      </CardHeader>
      <CardContent>
        {partners.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cupom</TableHead>
                  <TableHead className="text-right">Pontos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => (
                  <TableRow key={partner.id}>
<<<<<<< HEAD
                    <TableCell className="font-mono text-xs text-muted-foreground truncate" style={{maxWidth: '100px'}} title={partner.id}>
                        {partner.id.substring(0,8)}...
=======
                    <TableCell className="font-mono text-xs text-muted-foreground truncate" style={{ maxWidth: '100px' }} title={partner.id}>
                      {partner.id.substring(0, 8)}...
>>>>>>> 78b646e (feat: migrate backend to PocketBase and update UI to premium dark theme)
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{partner.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono bg-primary/20 text-primary-foreground hover:bg-primary/30">{partner.coupon}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">{partner.points.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">Nenhum parceiro cadastrado.</p>
        )}
      </CardContent>
    </Card>
  );
}
