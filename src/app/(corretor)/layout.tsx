
'use client';
import {SidebarProvider, Sidebar, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarHeader, SidebarInset} from '@/components/ui/sidebar';
import { Home, Briefcase, User, Star, LogOut, Share2, Building2, Folder, Settings, Percent, Mail, Link as LinkIcon, FileText, Gem, LifeBuoy, ShieldCheck, Palette, Users, Search, Rss, Droplet } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useFirestore, useUser, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Lead, Agent, Review, SubUser } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePlan } from '@/context/PlanContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const { plan } = usePlan();

  const [currentUserLevel, setCurrentUserLevel] = useState<SubUser['level'] | 'owner' | null>(null);

  const agentRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'agents', user.uid) : null),
    [user, firestore]
  );
  const { data: agentData, isLoading: isAgentLoading } = useDoc<Agent>(agentRef);

  useEffect(() => {
    if (!isUserLoading && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [user, isUserLoading, router, pathname]);

  useEffect(() => {
    // Aguarda o carregamento dos dados do agente antes de executar a lógica
    if (isAgentLoading || !agentData || typeof window === 'undefined') {
        return;
    }
    
    const subUserId = sessionStorage.getItem('subUserId');
    if (!subUserId) {
        // This is the race condition fix: if no subUserId is set,
        // and we have subUsers, redirect to selection.
        if (agentData.subUsers && agentData.subUsers.length > 0 && pathname !== '/selecao-usuario' && pathname !== '/login') {
            router.replace('/selecao-usuario');
            return; // Stop further execution in this render
        }
    }
    
    if (subUserId === agentData.id) {
      setCurrentUserLevel('owner');
    } else {
      const subUser = agentData.subUsers?.find(u => u.id === subUserId);
      setCurrentUserLevel(subUser?.level || null);
    }
    
  }, [agentData, isAgentLoading, pathname, router, user]);


  const unreadLeadsQuery = useMemoFirebase(
    () => user && firestore 
      ? query(collection(firestore, `agents/${user.uid}/leads`), where('status', '==', 'unread')) 
      : null,
    [user, firestore]
  );
  const { data: unreadLeads } = useCollection<Lead>(unreadLeadsQuery);
  const unreadCount = unreadLeads?.length || 0;

  const pendingReviewsQuery = useMemoFirebase(
    () => user && firestore 
      ? query(collection(firestore, `agents/${user.uid}/reviews`), where('approved', '==', false)) 
      : null,
    [user, firestore]
  );
  const { data: pendingReviews } = useCollection<Review>(pendingReviewsQuery);
  const pendingReviewsCount = pendingReviews?.length || 0;


  useEffect(() => {
    if (!agentData) return;

    // Theme logic
    const theme = agentData.siteSettings?.theme || 'dark';
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);

    // Favicon logic
    const faviconUrl = agentData.siteSettings?.faviconUrl;
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    link.href = faviconUrl || '/favicon.ico'; // Fallback to a default favicon

  }, [agentData]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('subUserId');
    }
    if(auth) {
      auth.signOut();
      router.push('/login');
    }
  };

  const agentSiteUrl = user ? `/corretor/${user.uid}` : '/';
  
  const hasPermission = (permissionFn: (level: any) => boolean) => {
      if (!currentUserLevel) return false;
      return permissionFn(currentUserLevel);
  }

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home, permission: () => true },
    { href: '/imoveis', label: 'Meus Imóveis', icon: Briefcase, permission: () => true },
    { href: '/inbox', label: 'Caixa de Entrada', icon: Mail, badgeCount: unreadCount, permission: () => true },
    { href: '/contatos', label: 'Contatos', icon: Users, permission: () => true },
    { href: '/usuarios', label: 'Usuários', icon: User, permission: (level: any) => plan !== 'simples' && (level === 'owner' || level === '3') },
    { href: '/integracoes', label: 'Integrações', icon: Rss, permission: (level: any) => level === 'owner' || level === '3' || level === '2' },
    { href: '/perfil', label: 'Perfil', icon: User, permission: (level: any) => level === 'owner' || level === '3' || level === '2' },
    { href: '/avaliacoes', label: 'Avaliações', icon: Star, badgeCount: pendingReviewsCount, badgeClass: 'bg-yellow-500 text-black', permission: () => true },
    { href: '/suporte', label: 'Suporte', icon: LifeBuoy, permission: () => true },
    { href: '/meu-plano', label: 'Meu Plano', icon: Gem, permission: (level: any) => level === 'owner' },
    { href: agentSiteUrl, label: 'Meu Site Público', icon: Share2, target: '_blank', permission: () => true },
  ];
  
  const adminMenuItems = [
      { href: '/admin/dashboard', label: 'Painel Admin', icon: ShieldCheck, permission: () => agentData?.role === 'admin' },
  ];

  const pageSettingsItems = [
      { href: '/configuracoes/aparencia', label: 'Aparência', icon: Palette, permission: (level: any) => level === 'owner' || level === '3' },
      { href: '/configuracoes/aparencia/marcadagua', label: 'Marca d\'água', icon: Droplet, permission: (level: any) => level === 'owner' || level === '3' },
      { href: '/configuracoes/links', label: 'Links e Exibição', icon: LinkIcon, permission: (level: any) => level === 'owner' || level === '3' },
      { href: '/configuracoes/secoes', label: 'Gerenciar Seções', icon: Folder, permission: () => true },
  ];

  const generalSettingsItems = [
      { href: '/configuracoes/seo', label: 'SEO da Página', icon: Search, permission: (level: any) => level === 'owner' || level === '3' },
      { href: '/configuracoes/metricas', label: 'Métricas e Comissões', icon: Percent, permission: (level: any) => level === 'owner' || level === '3' || level === '2' },
      { href: '/configuracoes/politicas', label: 'Políticas e Termos', icon: FileText, permission: (level: any) => level === 'owner' || level === '3' },
  ];
  
  const showSettings = pageSettingsItems.length > 0 || generalSettingsItems.length > 0;
  const canSeeSettings = pageSettingsItems.some(item => hasPermission(item.permission)) || generalSettingsItems.some(item => hasPermission(item.permission));


  if (isUserLoading || isAgentLoading || (user && !currentUserLevel && pathname !== '/selecao-usuario' && pathname !== '/login')) {
    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
        </div>
    );
  }
  
  const MenuItemWrapper = ({ item, children }: { item: any, children: React.ReactNode }) => {
    const permitted = hasPermission(item.permission);
    
    // If not permitted, render a div with a tooltip instead of a link
    if (!permitted) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="w-full opacity-50 cursor-not-allowed">
                            <SidebarMenuButton asChild={false} disabled={true} tooltip={{ children: item.label }}>
                                {item.icon && <item.icon />}
                                <span className="flex-1">{item.label}</span>
                                {item.badgeCount > 0 && (
                                    <Badge className={`h-5 group-data-[collapsible=icon]:hidden ${item.badgeClass || ''}`}>{item.badgeCount}</Badge>
                                )}
                            </SidebarMenuButton>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="right"><p>Seu usuário não tem acesso</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }
    
    // If permitted, render the children (which should contain the Link)
    return <>{children}</>;
  };

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
                 <MenuItemWrapper item={item}>
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
                            <Badge className={`h-5 group-data-[collapsible=icon]:hidden ${item.badgeClass || ''}`}>{item.badgeCount}</Badge>
                        )}
                    </Link>
                    </SidebarMenuButton>
                </MenuItemWrapper>
              </SidebarMenuItem>
            ))}
            {showSettings && (
             <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-none">
                 <MenuItemWrapper item={{ permission: () => canSeeSettings }}>
                    <AccordionTrigger disabled={!canSeeSettings} className="[&[data-state=open]>svg]:rotate-180 flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg:last-child]:ms-auto">
                        <Settings/>
                        <span className="group-data-[collapsible=icon]:hidden">Configurações</span>
                    </AccordionTrigger>
                </MenuItemWrapper>
                <AccordionContent className="p-0 pl-4 space-y-2">
                    {pageSettingsItems.length > 0 && (
                    <div>
                        <p className="px-4 py-2 text-xs font-semibold text-muted-foreground">Configuração da Página</p>
                        <SidebarMenu>
                        {pageSettingsItems.map((item) => (
                          <SidebarMenuItem key={item.href}>
                             <MenuItemWrapper item={item}>
                                <SidebarMenuButton
                                asChild
                                size="sm"
                                isActive={pathname.startsWith(item.href)}
                                tooltip={{ children: item.label }}
                                >
                                <Link href={item.href}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </Link>
                                </SidebarMenuButton>
                            </MenuItemWrapper>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </div>
                    )}
                    {generalSettingsItems.length > 0 && (
                    <div>
                        <p className="px-4 py-2 text-xs font-semibold text-muted-foreground">Configuração Geral</p>
                        <SidebarMenu>
                        {generalSettingsItems.map((item) => (
                          <SidebarMenuItem key={item.href}>
                            <MenuItemWrapper item={item}>
                                <SidebarMenuButton
                                asChild
                                size="sm"
                                isActive={pathname.startsWith(item.href)}
                                tooltip={{ children: item.label }}
                                >
                                <Link href={item.href}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </Link>
                                </SidebarMenuButton>
                            </MenuItemWrapper>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                   </div>
                   )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            )}
            {adminMenuItems.filter(item => hasPermission(item.permission)).length > 0 && (
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
