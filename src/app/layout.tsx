<<<<<<< HEAD
import type {Metadata} from 'next';
=======
import type { Metadata } from 'next';
>>>>>>> 78b646e (feat: migrate backend to PocketBase and update UI to premium dark theme)
import './globals.css';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'DARKSTORE PONTOS',
  description: 'DARKSTORE PONTOS - Sistema de gerenciamento de pontos para DarkStore Suplementos',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet" />
      </head>
<<<<<<< HEAD
      <body className="font-body antialiased bg-background text-foreground">
=======
      <body className="font-body antialiased bg-background text-foreground bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-900/40 via-background to-background min-h-screen">
>>>>>>> 78b646e (feat: migrate backend to PocketBase and update UI to premium dark theme)
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
