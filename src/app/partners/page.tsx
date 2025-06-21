import { PartnerForm } from "@/components/partners/PartnerForm";
import { PartnersTable } from "@/components/partners/PartnersTable";
import { Skeleton } from "@/components/ui/skeleton";
import { getPartners } from "@/lib/mock-data";
import { ConfigError } from "@/components/config-error/ConfigError";
import type { Partner } from "@/types";

export default async function PartnersPage() {
  const result = await getPartners();
  
  if (result.error) {
    return <ConfigError message={result.error} />;
  }

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

function PartnersTableSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="space-y-2 mb-4">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
