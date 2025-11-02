'use client';
import {SidebarProvider, Sidebar, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarHeader, SidebarInset} from '@/components/ui/sidebar';
import { Home, Briefcase, User, SlidersHorizontal, Star, LogOut, Share2, Building2, Folder, Settings, Percent, Mail, Link as LinkIcon, FileText, Gem, LifeBuoy, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useFirestore, useUser, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { useEffect } from 'react';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Lead, Agent } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function CorretorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const agentRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'agents', user.uid) : null),
    [user, firestore]
  );
  const { data: agentData } = useDoc<Agent>(agentRef);

  const unreadLeadsQuery = useMemoFirebase(
    () => user && firestore 
      ? query(collection(firestore, `agents/${user.uid}/leads`), where('status', '==', 'unread')) 
      : null,
    [user, firestore]
  );
  const { data: unreadLeads } = useCollection<Lead>(unreadLeadsQuery);
  const unreadCount = unreadLeads?.length || 0;

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
    { href: '/inbox', label: 'Caixa de Entrada', icon: Mail, badgeCount: unreadCount },
    { href: '/perfil', label: 'Perfil', icon: User },
    { href: '/avaliacoes', label: 'Avaliações', icon: Star },
    { href: '/suporte', label: 'Suporte', icon: LifeBuoy },
    { href: '/meu-plano', label: 'Meu Plano', icon: Gem },
    { href: agentSiteUrl, label: 'Meu Site Público', icon: Share2, target: '_blank' },
  ];
  
  const adminMenuItems = [
      { href: '/admin/dashboard', label: 'Painel Admin', icon: ShieldCheck },
  ]

  const settingsItems = [
      { href: '/configuracoes/aparencia', label: 'Controle de Exibição', icon: SlidersHorizontal },
      { href: '/configuracoes/secoes', label: 'Gerenciar Seções', icon: Folder },
      { href: '/configuracoes/metricas', label: 'Métricas e Comissões', icon: Percent },
      { href: '/configuracoes/links', label: 'Links e Redes Sociais', icon: LinkIcon },
      { href: '/configuracoes/politicas', label: 'Políticas e Termos', icon: FileText },
  ]
  
  if (isUserLoading || !user) {
    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
        </div>
    );
  }

  const isAdmin = agentData?.role === 'admin';

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
                  isActive={pathname === item.href}
                  tooltip={{
                    children: item.label,
                  }}
                >
                  <Link href={item.href} target={item.target}>
                    <item.icon />
                    <span className="flex-1">{item.label}</span>
                     {item.badgeCount && item.badgeCount > 0 && (
                        <Badge className="h-5 group-data-[collapsible=icon]:hidden">{item.badgeCount}</Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
             <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-none">
                <AccordionTrigger className="[&[data-state=open]>svg]:rotate-180 flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg:last-child]:ms-auto">
                    <Settings/>
                    <span className="group-data-[collapsible=icon]:hidden">Configurações</span>
                </AccordionTrigger>
                <AccordionContent className="p-0 pl-7">
                   <SidebarMenu>
                    {settingsItems.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          size="sm"
                          isActive={pathname.startsWith(item.href)}
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
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            {isAdmin && (
                <>
                    <Separator className="my-2" />
                    {adminMenuItems.map((item) => (
                         <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                            asChild
                            isActive={pathname.startsWith(item.href)}
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
                </>
            )}
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
