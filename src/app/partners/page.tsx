
import { PartnerForm } from "@/components/partners/PartnerForm";
import { PartnersTable } from "@/components/partners/PartnersTable";
import { getPartners } from "@/lib/mock-data";

export default async function PartnersPage() {
  const result = await getPartners();
  const partners = result.partners || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Gerenciamento de Parceiros</h1>
        <p className="text-muted-foreground">Adicione novos parceiros e visualize os parceiros existentes.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <PartnerForm />
        </div>
        <div className="lg:col-span-2">
          <PartnersTable partners={partners} />
        </div>
      </div>
    </div>
  );
}
