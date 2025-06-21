
import { SalesForm } from "@/components/sales/SalesForm";
import { getPartners } from "@/lib/mock-data";

export default async function SalesPage() {
  const partnersResult = await getPartners();
  const partners = partnersResult.partners || [];

  return (
    <div className="flex flex-col items-center justify-start pt-8 md:pt-12">
        <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2 text-center">Registrar Nova Venda</h1>
            <p className="text-muted-foreground mb-8 text-center">Utilize o cupom do parceiro para aplicar o desconto e gerar pontos.</p>
            <SalesForm partners={partners} />
        </div>
    </div>
  );
}
