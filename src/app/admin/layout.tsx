'use client';
import { useEffect } from 'react';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import type { Agent } from '@/lib/data';
import { LogOut, ShieldCheck, User, LayoutDashboard, LifeBuoy } from 'lucide-react';
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
    if (!isAgentLoading && agentData && agentData.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, agentData, isAgentLoading, router]);

  if (isUserLoading || isAgentLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
        <p className="ml-4 text-muted-foreground">Verificando permissões...</p>
      </div>
    );
  }

  if (agentData?.role !== 'admin') {
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
             <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/painel">
                        <LayoutDashboard/>
                        <span>Dashboard</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/support">
                        <LifeBuoy/>
                        <span>Suporte</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/dashboard">
                        <User/>
                        <span>Visão do Corretor</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
         <Sidebar.Footer className="p-2">
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => router.push('/login')}>
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
