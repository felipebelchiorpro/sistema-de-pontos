
<<<<<<< HEAD
import { SupabaseTest } from "@/components/settings/SupabaseTest";
=======
import { PocketBaseTest } from "@/components/settings/PocketBaseTest";
>>>>>>> 78b646e (feat: migrate backend to PocketBase and update UI to premium dark theme)

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Configurações e Diagnóstico</h1>
        <p className="text-muted-foreground">Utilize esta página para diagnosticar problemas de conexão com o banco de dados.</p>
      </div>
<<<<<<< HEAD
      <SupabaseTest />
=======
      <PocketBaseTest />
>>>>>>> 78b646e (feat: migrate backend to PocketBase and update UI to premium dark theme)
    </div>
  );
}
