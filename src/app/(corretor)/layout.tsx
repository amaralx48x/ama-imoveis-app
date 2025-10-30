'use client';
import {SidebarProvider, Sidebar, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarHeader, SidebarInset} from '@/components/ui/sidebar';
import { Home, Briefcase, Mail, User, Settings, Palette, Star, BarChart, FileText, Building2, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useEffect } from 'react';

export default function CorretorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const auth = useAuth();

  useEffect(() => {
    if (auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [auth]);

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/inbox', label: 'Caixa de Entrada', icon: Mail },
    { href: '/imoveis', label: 'Meus Imóveis', icon: Briefcase },
    { href: '/imoveis/novo', label: 'Adicionar Imóvel', icon: PlusCircle },
    { href: '/perfil', label: 'Meu Site', icon: User },
    { href: '/avaliacoes', label: 'Avaliações', icon: Star },
    { href: '/configuracoes/comissoes', label: 'Comissões', icon: BarChart },
    { href: '/configuracoes/aparencia', label: 'Aparência', icon: Palette },
    { href: '/configuracoes/documentos', label: 'Documentos', icon: FileText },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
                 <span className="text-gradient">
                    <Building2 className="h-6 w-6" />
                </span>
                <span className="font-bold font-headline text-lg group-data-[collapsible=icon]:hidden">AMA Imóveis</span>
            </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href === '/imoveis' && pathname.startsWith('/imoveis/'))}
                  tooltip={{
                    children: item.label,
                  }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger />
            {/* User menu can go here */}
        </header>
        <main className="p-4 md:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
