
'use client';
import { useEffect } from 'react';
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { doc } from 'firebase/firestore';
import type { Agent } from '@/lib/data';
import { LogOut, ShieldCheck, User, LayoutDashboard, LifeBuoy, MonitorPlay } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const auth = useAuth();
  const pathname = usePathname();
  const firestore = useFirestore();

  const agentRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'agents', user.uid) : null),
    [user, firestore]
  );
  const { data: agentData, isLoading: isAgentLoading } = useDoc<Agent>(agentRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
    // A condição !isAgentLoading garante que só tomamos a decisão depois de saber o papel do usuário.
    if (!isUserLoading && !isAgentLoading && agentData && agentData.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, agentData, isAgentLoading, router]);

  const handleLogout = () => {
    if(auth) {
      auth.signOut();
      router.push('/login');
    }
  };


  if (isUserLoading || isAgentLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
        <p className="ml-4 text-muted-foreground">Verificando permissões...</p>
      </div>
    );
  }

  // Se, após o carregamento, o usuário não for admin, ele já terá sido redirecionado.
  // Mas como uma proteção extra, podemos mostrar uma mensagem de acesso negado.
  if (!agentData || agentData.role !== 'admin') {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-center">
            <h1 className="text-4xl font-bold text-destructive mb-4">Acesso Negado</h1>
            <p className="text-muted-foreground mb-6">Você não tem permissão para acessar esta página.</p>
            <Button asChild>
                <Link href="/dashboard">Voltar para o Dashboard</Link>
            </Button>
        </div>
    )
  }

  const menuItems = [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/marketing', label: 'Página de Marketing', icon: MonitorPlay },
      { href: '/admin/support', label: 'Suporte', icon: LifeBuoy },
      { href: '/dashboard', label: 'Visão do Corretor', icon: User },
  ]

  return (
     <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
                 <span className="text-gradient">
                    <ShieldCheck className="h-6 w-6" />
                </span>
                <span className="font-bold font-headline text-lg group-data-[collapsible=icon]:hidden">Admin</span>
            </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
             {menuItems.map((item) => (
                 <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname === item.href}>
                        <Link href={item.href}>
                            <item.icon/>
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
        </header>
        <main className="p-4 md:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
