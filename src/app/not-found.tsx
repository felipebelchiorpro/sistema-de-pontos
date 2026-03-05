import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <h2 className="text-2xl font-bold">Página não encontrada</h2>
            <p className="text-muted-foreground">A página que você está procurando não existe.</p>
            <Link href="/" className="text-primary hover:underline">
                Voltar para a página inicial
            </Link>
        </div>
    );
}
