'use client';
import {SidebarProvider, Sidebar, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarHeader, SidebarInset} from '@/components/ui/sidebar';
import { Home, Briefcase, Mail, User, SlidersHorizontal, Star, LogOut, Share2, Building2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { useEffect } from 'react';
import { useUser } from '@/firebase/provider';
import { Button } from '@/components/ui/button';

export default function CorretorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleLogout = () => {
    if(auth) {
      auth.signOut();
      router.push('/login');
    }
  };

  const agentSiteUrl = user ? `/corretor/${user.uid}` : '/';

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/imoveis', label: 'Meus Imóveis', icon: Briefcase },
    { href: '/perfil', label: 'Perfil', icon: User },
    { href: '/inbox', label: 'Caixa de Entrada', icon: Mail },
    { href: agentSiteUrl, label: 'Meu Site Público', icon: Share2, target: '_blank' },
    { href: '/avaliacoes', label: 'Avaliações', icon: Star },
    { href: '/configuracoes/aparencia', label: 'Controle de Exibição', icon: SlidersHorizontal },
  ];
  
  if (isUserLoading || !user) {
    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
        </div>
    );
  }

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
                  isActive={pathname === item.href || (item.href.startsWith('/imoveis') && pathname.startsWith('/imoveis')) || (item.href.startsWith('/configuracoes') && pathname.startsWith('/configuracoes')) || (item.href.startsWith('/avaliacoes') && pathname.startsWith('/avaliacoes'))}
                  tooltip={{
                    children: item.label,
                  }}
                >
                  <Link href={item.href} target={item.target}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
         <Sidebar.Footer className="p-2">
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
                <LogOut />
                <span className="group-data-[collapsible=icon]:hidden">Sair</span>
            </Button>
        </Sidebar.Footer>
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
