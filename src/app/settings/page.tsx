import { FirebaseTest } from "@/components/settings/FirebaseTest";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Configurações e Diagnóstico</h1>
        <p className="text-muted-foreground">Utilize esta página para diagnosticar problemas de conexão com o banco de dados.</p>
      </div>
      <FirebaseTest />
    </div>
  );
}
