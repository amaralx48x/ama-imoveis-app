
'use client';
import {SidebarProvider, Sidebar, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarHeader, SidebarInset} from '@/components/ui/sidebar';
import { Home, Briefcase, User, SlidersHorizontal, Star, LogOut, Share2, Building2, Folder, Settings, Percent, Mail, Link as LinkIcon, FileText, Gem, LifeBuoy, ShieldCheck, Palette, Users, Image as ImageIcon, Search, Rss } from 'lucide-react';
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

  const [activeSubUserId, setActiveSubUserId] = useState<string | null>(null);
  const [currentUserLevel, setCurrentUserLevel] = useState<SubUser['level'] | 'owner' | null>(null);

  const agentRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'agents', user.uid) : null),
    [user, firestore]
  );
  const { data: agentData } = useDoc<Agent>(agentRef);

  useEffect(() => {
    const subUserId = sessionStorage.getItem('subUserId');
    setActiveSubUserId(subUserId);

    if (!agentData || !subUserId) return;

    if (subUserId === agentData.id) {
      setCurrentUserLevel('owner');
    } else {
      const subUser = agentData.subUsers?.find(u => u.id === subUserId);
      setCurrentUserLevel(subUser?.level || null);
    }
  }, [agentData]);

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
    if (isUserLoading || !agentData) return; // Aguarda dados essenciais

    if (!user) {
      router.replace('/login');
      return;
    }

    const hasSubUsers = agentData.subUsers && agentData.subUsers.length > 0;
    const isSessionSelected = sessionStorage.getItem('subUserId');
    const isOnSelectionPage = pathname === '/selecao-usuario';

    if (hasSubUsers && !isSessionSelected && !isOnSelectionPage) {
      router.replace('/selecao-usuario');
    }
  }, [user, isUserLoading, router, agentData, pathname]);

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
    sessionStorage.removeItem('subUserId');
    if(auth) {
      auth.signOut();
      router.push('/login');
    }
  };

  const agentSiteUrl = user ? `/corretor/${user.uid}` : '/';
  
  const showUsersMenu = plan !== 'simples' && (currentUserLevel === 'owner' || currentUserLevel === '3');
  const canSeeProfile = currentUserLevel === 'owner' || currentUserLevel === '3' || currentUserLevel === '2';
  const canSeeMetrics = currentUserLevel === 'owner' || currentUserLevel === '3';
  const canSeePolicies = currentUserLevel === 'owner' || currentUserLevel === '3';
  const canSeeCommissions = currentUserLevel === 'owner' || currentUserLevel === '3' || currentUserLevel === '2';

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home, allowed: true },
    { href: '/imoveis', label: 'Meus Imóveis', icon: Briefcase, allowed: true },
    { href: '/inbox', label: 'Caixa de Entrada', icon: Mail, badgeCount: unreadCount, allowed: true },
    { href: '/contatos', label: 'Contatos', icon: Users, allowed: true },
    { href: '/usuarios', label: 'Usuários', icon: User, allowed: showUsersMenu },
    { href: '/integracoes', label: 'Integrações', icon: Rss, allowed: canSeeProfile },
    { href: '/perfil', label: 'Perfil', icon: User, allowed: canSeeProfile },
    { href: '/avaliacoes', label: 'Avaliações', icon: Star, badgeCount: pendingReviewsCount, badgeClass: 'bg-yellow-500 text-black', allowed: true },
    { href: '/suporte', label: 'Suporte', icon: LifeBuoy, allowed: true },
    { href: '/meu-plano', label: 'Meu Plano', icon: Gem, allowed: currentUserLevel === 'owner' },
    { href: agentSiteUrl, label: 'Meu Site Público', icon: Share2, target: '_blank', allowed: true },
  ].filter(item => item.allowed);
  
  const adminMenuItems = [
      { href: '/admin/dashboard', label: 'Painel Admin', icon: ShieldCheck, allowed: agentData?.role === 'admin' },
  ].filter(item => item.allowed);

  const pageSettingsItems = [
      { href: '/configuracoes/aparencia', label: 'Aparência', icon: Palette, allowed: currentUserLevel === 'owner' || currentUserLevel === '3' },
      { href: '/configuracoes/links', label: 'Links e Exibição', icon: LinkIcon, allowed: currentUserLevel === 'owner' || currentUserLevel === '3' },
      { href: '/configuracoes/secoes', label: 'Gerenciar Seções', icon: Folder, allowed: true },
  ].filter(item => item.allowed);

  const generalSettingsItems = [
      { href: '/configuracoes/seo', label: 'SEO da Página', icon: Search, allowed: currentUserLevel === 'owner' || currentUserLevel === '3' },
      { href: '/configuracoes/metricas', label: 'Métricas e Comissões', icon: Percent, allowed: canSeeMetrics },
      { href: '/configuracoes/politicas', label: 'Políticas e Termos', icon: FileText, allowed: canSeePolicies },
  ].filter(item => item.allowed);
  
  const showSettings = pageSettingsItems.length > 0 || generalSettingsItems.length > 0;

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
              </SidebarMenuItem>
            ))}
            {showSettings && (
             <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-none">
                <AccordionTrigger className="[&[data-state=open]>svg]:rotate-180 flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg:last-child]:ms-auto">
                    <Settings/>
                    <span className="group-data-[collapsible=icon]:hidden">Configurações</span>
                </AccordionTrigger>
                <AccordionContent className="p-0 pl-4 space-y-2">
                    {pageSettingsItems.length > 0 && (
                    <div>
                        <p className="px-4 py-2 text-xs font-semibold text-muted-foreground">Configuração da Página</p>
                        <SidebarMenu>
                        {pageSettingsItems.map((item) => (
                          <SidebarMenuItem key={item.href}>
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
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                   </div>
                   )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            )}
            {adminMenuItems.length > 0 && (
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
