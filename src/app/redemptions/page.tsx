import { RedemptionForm } from "@/components/redemptions/RedemptionForm";
import { getPartners } from "@/lib/mock-data";
import { ConfigError } from "@/components/config-error/ConfigError";

export default async function RedemptionsPage() {
  const partnersResult = await getPartners();

  if (partnersResult.error) {
    return <ConfigError message={partnersResult.error} />;
  }

  const partners = partnersResult.partners || [];

  return (
    <div className="flex flex-col items-center justify-start pt-8 md:pt-12">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2 text-center">Resgate de Pontos</h1>
        <p className="text-muted-foreground mb-8 text-center">Permita que parceiros resgatem seus pontos acumulados.</p>
        <RedemptionForm partners={partners} />
      </div>
    </div>
  );
}