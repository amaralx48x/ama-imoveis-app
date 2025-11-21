'use client';
import {SidebarProvider, Sidebar, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarHeader, SidebarInset} from '@/components/ui/sidebar';
import { Home, Briefcase, User, SlidersHorizontal, Star, LogOut, Share2, Building2, Folder, Settings, Percent, Mail, Link as LinkIcon, FileText, Gem, LifeBuoy, ShieldCheck, Palette, Users, Image as ImageIcon, Search, PictureInPicture, FlaskConical, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useFirestore, useUser, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { useEffect } from 'react';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Lead, Agent, Review } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useDemo } from '@/context/DemoContext';
import { Skeleton } from '@/components/ui/skeleton';

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
  const { isDemo, endDemo, sessionId } = useDemo();

  const { data: agentData } = useDoc<Agent>(useMemoFirebase(() => (firestore && user && !isDemo ? doc(firestore, 'agents', user.uid) : null), [firestore, user, isDemo]));

  const unreadLeadsQuery = useMemoFirebase(
    () => (user && firestore && !isDemo ? query(collection(firestore, `agents/${user.uid}/leads`), where('status', '==', 'unread')) : null),
    [user, firestore, isDemo]
  );
  const { data: unreadLeads } = useCollection<Lead>(unreadLeadsQuery);
  const unreadCount = isDemo ? 1 : unreadLeads?.length || 0;

  const pendingReviewsQuery = useMemoFirebase(
    () => user && firestore && !isDemo
      ? query(collection(firestore, `agents/${user.uid}/reviews`), where('approved', '==', false)) 
      : null,
    [user, firestore, isDemo]
  );
  const { data: pendingReviews } = useCollection<Review>(pendingReviewsQuery);
  const pendingReviewsCount = isDemo ? 1 : pendingReviews?.length || 0;


  useEffect(() => {
    if (!isUserLoading && !user && !isDemo) {
      router.push('/login');
    }
  }, [user, isUserLoading, router, isDemo]);

  useEffect(() => {
    if (isDemo) return; // Não aplicar tema ou favicon do agente real no modo demo
    const theme = agentData?.siteSettings?.theme || 'dark';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [agentData, isDemo]);

  useEffect(() => {
    if (isDemo) return;
    if (agentData?.siteSettings?.faviconUrl) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = agentData.siteSettings.faviconUrl;
    }
  }, [agentData, isDemo]);

  const handleLogout = () => {
    if (auth) {
        auth.signOut();
        router.push('/login');
    }
  };

  const agentSiteUrl = isDemo ? `/preview/${sessionId}` : `/corretor/${user?.uid}`;
  const isAdmin = agentData?.role === 'admin' && !isDemo;

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/imoveis', label: 'Meus Imóveis', icon: Briefcase },
    { href: '/inbox', label: 'Caixa de Entrada', icon: Mail, badgeCount: unreadCount },
    { href: '/contatos', label: 'Contatos', icon: Users },
    { href: '/perfil', label: 'Perfil', icon: User },
    { href: '/avaliacoes', label: 'Avaliações', icon: Star, badgeCount: pendingReviewsCount, badgeClass: 'bg-yellow-500 text-black' },
    { href: '/suporte', label: 'Suporte', icon: LifeBuoy },
    { href: '/meu-plano', label: 'Meu Plano', icon: Gem },
    { href: agentSiteUrl, label: 'Meu Site Público', icon: Share2, target: '_blank' },
  ];
  
  const adminMenuItems = [
      { href: '/admin/dashboard', label: 'Painel Admin', icon: ShieldCheck },
  ]

  const settingsItems = [
      { href: '/configuracoes/aparencia', label: 'Aparência', icon: Palette },
      { href: '/configuracoes/hero', label: 'Imagem de Capa', icon: PictureInPicture },
      { href: '/configuracoes/favicon', label: 'Favicon', icon: ImageIcon },
      { href: '/configuracoes/links', label: 'Links e Exibição', icon: LinkIcon },
      { href: '/configuracoes/secoes', label: 'Gerenciar Seções', icon: Folder },
      { href: '/configuracoes/seo', label: 'SEO da Página', icon: Search },
      { href: '/configuracoes/metricas', label: 'Métricas e Comissões', icon: Percent },
      { href: '/configuracoes/politicas', label: 'Políticas e Termos', icon: FileText },
  ]
  
  if (isUserLoading) {
    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <Skeleton className="h-full w-20 mr-4" />
            <div className="flex-1 space-y-4">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
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
             {isDemo && (
                <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
                    <div className="flex items-center justify-center gap-2 text-sm p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary-foreground">
                        <FlaskConical className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-bold text-primary">Modo Demo</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={endDemo}>
                            <X className="h-4 w-4"/>
                        </Button>
                    </div>
                </div>
            )}
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
            {!isDemo && (
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
                  <LogOut />
                  <span className="group-data-[collapsible=icon]:hidden">Sair</span>
              </Button>
            )}
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
