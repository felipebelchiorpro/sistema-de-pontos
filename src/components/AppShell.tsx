"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Home, Users, ShoppingCart, Gift, BarChart3, Settings, LogOut, Store, ListChecks, Calculator } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Toaster } from "@/components/ui/toaster";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/partners', label: 'Parceiros', icon: Users },
  { href: '/sales', label: 'Registrar Venda', icon: ShoppingCart },
  { href: '/redemptions', label: 'Resgatar Pontos', icon: Gift },
  { href: '/calculator', label: 'Calculadora', icon: Calculator },
  { href: '/reports', label: 'Relatórios', icon: BarChart3 },
  { href: '/transactions', label: 'Transações', icon: ListChecks },
  { href: '/settings', label: 'Configurações', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen">
        <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r border-sidebar-border">
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-2">
                <Store className="w-8 h-8 text-primary" />
                <h1 className="text-lg font-semibold text-foreground group-data-[collapsible=icon]:hidden">
                DARKSTORE PONTOS
                </h1>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                    tooltip={{ children: item.label, className:"bg-popover text-popover-foreground" }}
                    className="justify-start"
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 mt-auto">
            <SidebarMenu>
                 <SidebarMenuItem>
                     <SidebarMenuButton
                      asChild
                      tooltip={{ children: "Sair", className:"bg-popover text-popover-foreground" }}
                      className="justify-start"
                    >
                      <a>
                        <LogOut />
                        <span className="group-data-[collapsible=icon]:hidden">Sair</span>
                      </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1 flex flex-col overflow-hidden">
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6">
                <SidebarTrigger className="md:hidden" />
                <div className="flex-1">
                    {/* Breadcrumbs or page title can go here */}
                    <h1 className="text-lg font-semibold">
                        {navItems.find(item => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)))?.label || 'DARKSTORE PONTOS'}
                    </h1>
                </div>
                {/* Add User Avatar/Menu if needed */}
            </header>
            <main className="flex-1 overflow-auto p-6 bg-background">
              {children}
            </main>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
