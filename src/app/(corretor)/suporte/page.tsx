
'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import { useFirestore, useUser, useFirebaseApp, useMemoFirebase } from '@/firebase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { LifeBuoy, Loader2, Upload, X, MessageSquare, AlertTriangle, Briefcase, Users, Gem, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { v4 as uuidv4 } from 'uuid';
import type { SupportMessage, MarketingContent } from '@/lib/data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import ImageUpload from '@/components/image-upload';
import { InfoCard } from '@/components/info-card';
import Link from 'next/link';

const faqTopics = [
  {
    topic: 'Gerenciamento de Imóveis',
    icon: Briefcase,
    questions: [
      {
        question: 'Como cadastrar um novo imóvel?',
        answer: '1. **Acesse a Seção:** No menu lateral, clique em "Meus Imóveis".\n2. **Inicie o Cadastro:** No canto superior direito, clique no botão roxo "Adicionar Imóvel".\n3. **Preencha os Dados:** Complete todos os campos do formulário com as informações do imóvel. Quanto mais detalhes, melhor para o anúncio.\n4. **Envie as Imagens:** Na seção de imagens, envie fotos de alta qualidade. A primeira imagem que você enviar será a foto de capa do anúncio no seu site.\n5. **Salve:** Após preencher tudo, clique em "Salvar Imóvel". Ele aparecerá instantaneamente na aba "Ativos" e no seu site público.',
      },
      {
        question: 'Como editar um imóvel já cadastrado?',
        answer: '1. **Encontre o Imóvel:** Na lista de "Meus Imóveis", localize o card do imóvel que deseja alterar.\n2. **Acesse o Menu:** Clique no ícone de três pontinhos (⋮) no canto superior direito do card do imóvel.\n3. **Selecione Editar:** No menu que aparecer, escolha a opção "Editar Imóvel".\n4. **Faça as Alterações:** Modifique os campos necessários no formulário e clique em "Salvar Alterações" no final da página.',
      },
      {
        question: 'Como marcar um imóvel como "Vendido" ou "Alugado"?',
        answer: '1. **Acesse o Menu:** Na página "Meus Imóveis", encontre o imóvel e clique no menu de três pontinhos (⋮).\n2. **Selecione a Opção:** Escolha a opção "Marcar como Vendido" ou "Marcar como Alugado".\n3. **Confirme os Valores:** Uma janela aparecerá para você confirmar o valor final da transação e o percentual de comissão. O sistema calcula o valor final da comissão automaticamente, mas você pode ajustá-lo.\n4. **Confirme:** Ao confirmar, o imóvel será movido para a aba correspondente ("Vendidos" ou "Alugados") e a comissão será registrada no seu Dashboard.',
      },
      {
        question: 'Como funciona a importação de imóveis por CSV?',
        answer: 'Este recurso está disponível no plano **Imobiliária Plus**.\n1. **Acesse a Página:** Em "Meus Imóveis", clique no botão "Importar CSV".\n2. **Baixe o Modelo:** Para garantir a formatação correta, baixe nosso arquivo de exemplo clicando no link disponível na página.\n3. **Preencha a Planilha:** Adicione os dados dos seus imóveis na planilha, seguindo as colunas do modelo.\n4. **Faça o Upload:** Selecione o arquivo preenchido. O sistema fará uma pré-validação, mostrando quantos imóveis estão corretos e quantos contêm erros.\n5. **Importe:** Se houver imóveis válidos, clique no botão para importá-los para sua conta.',
      },
    ],
  },
  {
    topic: 'Leads, Contatos e Avaliações',
    icon: Users,
    questions: [
      {
        question: 'Onde vejo os contatos dos clientes interessados?',
        answer: 'Todos os contatos e solicitações de agendamento gerados pelos formulários do seu site público chegam na **Caixa de Entrada**. As mensagens novas são marcadas como "Não lida" e ficam na aba principal para sua atenção.',
      },
      {
        question: 'Como gerencio as avaliações dos clientes?',
        answer: 'Acesse a seção **Avaliações**. Todas as novas avaliações enviadas pelo seu site chegam lá com o status "Pendente". Você tem a opção de "Aprovar" para que ela apareça publicamente no seu site, ou "Remover".',
      },
    ],
  },
   {
    topic: 'Configurações do Site Público',
    icon: Settings,
    questions: [
      {
        question: 'Como altero a aparência (cores) do meu site?',
        answer: 'Vá em **Configurações > Aparência**. Você pode escolher entre o tema Claro e Escuro. A alteração é aplicada instantaneamente no seu painel para você pré-visualizar. Clique em "Salvar" para aplicar a mudança também no seu site público.',
      },
       {
        question: 'O que são as "Seções Personalizadas"?',
        answer: 'Em **Configurações > Gerenciar Seções**, você pode criar categorias para agrupar seus imóveis, como "Lançamentos" ou "Imóveis de Luxo". Após criar uma seção, vá para "Meus Imóveis", clique no menu de um imóvel (⋮) e escolha "Associar a Seção" para adicioná-lo. Essas seções aparecerão como carrosséis de destaque em seu site público.',
      },
      {
        question: 'Como melhoro a visibilidade do meu site no Google (SEO)?',
        answer: 'Em **Configurações > SEO da Página**, você pode definir o título, descrição, palavras-chave e imagem de compartilhamento do seu site. Preencher esses campos ajuda seu site a ser melhor ranqueado no Google e a ter uma aparência mais profissional ao ser compartilhado em redes sociais.',
      },
    ],
  },
  {
    topic: 'Planos e Assinatura',
    icon: Gem,
    questions: [
      {
        question: 'Como funcionam os planos?',
        answer: 'Oferecemos diferentes planos para se adequar ao seu volume de negócios. Na seção **Meu Plano**, você pode ver os detalhes e limites do seu plano atual. O plano "Corretor Plus" é ótimo para começar, enquanto o "Imobiliária Plus" oferece recursos avançados, como imóveis ilimitados e importação via CSV.',
      },
    ],
  },
];


const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Data indisponível';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, "d 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR });
}

function MessagesHistory() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const messagesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'supportMessages'),
            where('senderId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
    }, [user, firestore]);

    useEffect(() => {
        if (!messagesQuery) {
            setIsLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const msgs = snapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    id: doc.id, 
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
                    responseAt: data.responseAt?.toDate ? data.responseAt.toDate().toISOString() : data.responseAt,
                } as SupportMessage;
            });
            setMessages(msgs);
            setIsLoading(false);
            setError(null);
        }, (err) => {
            console.error(err);
            if (err.code === 'permission-denied') {
                setError("Você não tem permissão para visualizar estas mensagens. Verifique as regras de segurança do Firestore.");
            } else {
                setError('Não foi possível carregar suas mensagens.');
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [messagesQuery]);

    return (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageSquare /> Histórico de Solicitações</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div className="space-y-4">
                       {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                    </div>
                )}
                {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Erro</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {!isLoading && !error && messages.length === 0 && (
                    <p className="text-muted-foreground text-sm text-center py-4">Você ainda não enviou nenhuma solicitação de suporte.</p>
                )}
                {!isLoading && messages.length > 0 && (
                    <Accordion type="multiple" className="w-full space-y-4">
                        {messages.map(msg => (
                            <AccordionItem key={msg.id} value={msg.id} className="border rounded-lg bg-card overflow-hidden">
                                <AccordionTrigger className="p-4 hover:no-underline data-[state=open]:bg-muted/50">
                                    <div className="flex justify-between items-center w-full">
                                        <p className="font-semibold truncate pr-4">{msg.message}</p>
                                        <div className="text-right flex items-center gap-4 flex-shrink-0">
                                            <span className="text-xs text-muted-foreground hidden sm:inline">{msg.createdAt ? formatDate(new Date(msg.createdAt)) : '...'}</span>
                                            <Badge variant={msg.status === 'pending' ? 'default' : 'secondary'}>
                                                {msg.status === 'pending' ? 'Pendente' : 'Respondido'}
                                            </Badge>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 pt-0">
                                    <div className="space-y-4 pt-4 border-t">
                                        <p className="text-muted-foreground whitespace-pre-wrap">{msg.message}</p>
                                        {msg.images && msg.images.length > 0 && (
                                            <div className="grid grid-cols-3 gap-2">
                                                {msg.images.map((url, i) => (
                                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                                        <Image src={url} alt={`Anexo ${i+1}`} width={200} height={200} className="rounded-md object-cover aspect-square hover:opacity-80 transition-opacity"/>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                        {msg.status === 'responded' && msg.responseMessage && (
                                            <div className="border-t pt-4 mt-4">
                                                <p className="font-semibold text-sm mb-2">Resposta do Suporte:</p>
                                                <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">{msg.responseMessage}</p>
                                                <p className="text-xs text-muted-foreground mt-2">Respondido em {msg.responseAt ? formatDate(new Date(msg.responseAt)) : '...'}</p>
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    )
}

function PrioritySupportCard({ whatsappNumber }: { whatsappNumber?: string }) {
    if (!whatsappNumber) return null;

    const whatsappLink = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Preciso de suporte prioritário.')}`;
    
    return (
        <Card className="bg-primary/10 border-primary/30">
            <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2"><Gem/> Atendimento Prioritário AMA ULTRA</CardTitle>
                <CardDescription className="text-primary/80">
                    Como membro AMA ULTRA, você tem acesso direto ao nosso suporte via WhatsApp para resoluções mais rápidas.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full bg-green-500 hover:bg-green-600">
                    <Link href={whatsappLink} target="_blank" rel="noopener noreferrer">
                        <MessageSquare className="mr-2 h-4 w-4"/> Falar no WhatsApp
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}


export default function SuportePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [message, setMessage] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageId] = useState(uuidv4()); // Stable ID for the message being composed
  const [marketingContent, setMarketingContent] = useState<MarketingContent | null>(null);

   useEffect(() => {
    if (!firestore) return;
    const contentRef = doc(firestore, 'marketing', 'content');
    const unsub = onSnapshot(contentRef, (doc) => {
        if (doc.exists()) {
            setMarketingContent(doc.data() as MarketingContent);
        }
    });
    return () => unsub();
   }, [firestore]);


  const handleUploadComplete = (url: string) => {
    setImageUrls(prev => [...prev, url]);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return toast({ title: 'A mensagem não pode estar vazia.', variant: 'destructive'});
    if (!user) return toast({ title: 'Usuário não autenticado.', variant: 'destructive'});

    setLoading(true);
    
    try {
      const supportCollectionRef = collection(firestore, 'supportMessages');
      await addDoc(supportCollectionRef, {
        id: messageId,
        senderId: user.uid,
        senderName: user.displayName || 'Não informado',
        senderEmail: user.email || 'Não informado',
        message,
        images: imageUrls,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Mensagem de suporte enviada!', description: 'Nossa equipe responderá em breve.' });
      setMessage('');
      setImageUrls([]); // Reset images
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Erro ao enviar mensagem', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <InfoCard cardId="suporte-info" title="Bem-vindo à Central de Suporte">
        <p>
            Este é o seu canal direto para tirar dúvidas ou reportar problemas. Nossa equipe de suporte está pronta para ajudar.
        </p>
        <p>
            Consulte as <strong>Perguntas Frequentes (FAQ)</strong> para respostas rápidas. Se não encontrar o que precisa, use o formulário para nos enviar uma mensagem detalhada. Você pode acompanhar o status das suas solicitações no <strong>Histórico</strong>.
        </p>
      </InfoCard>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2"><LifeBuoy/> Central de Suporte</CardTitle>
          <CardDescription>
            Tem alguma dúvida ou encontrou um problema? Consulte nossas perguntas frequentes ou nos envie uma mensagem.
          </CardDescription>
        </CardHeader>
      </Card>
      

      <Card>
        <CardHeader>
          <CardTitle>Perguntas Frequentes (FAQ)</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {faqTopics.map((topic) => (
              <AccordionItem value={topic.topic} key={topic.topic} className="border-b-0">
                <AccordionTrigger className="border rounded-md px-4 py-3 bg-card hover:bg-muted/50 font-bold text-lg [&[data-state=open]]:rounded-b-none">
                  <div className="flex items-center gap-3">
                    <topic.icon className="h-5 w-5 text-primary" />
                    {topic.topic}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border border-t-0 rounded-b-md p-0">
                    <Accordion type="single" collapsible className="w-full">
                         {topic.questions.map((q, i) => (
                            <AccordionItem value={`sub-item-${i}`} key={i} className={i === topic.questions.length - 1 ? "border-b-0" : ""}>
                                <AccordionTrigger className="px-4 py-3 text-base hover:no-underline">
                                    {q.question}
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-4">
                                    <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{q.answer}</p>
                                </AccordionContent>
                            </AccordionItem>
                         ))}
                    </Accordion>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Enviar uma Solicitação</CardTitle>
          <CardDescription>
            Se não encontrou sua resposta no FAQ, descreva seu problema abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Textarea
              placeholder="Descreva detalhadamente sua dúvida ou o erro que encontrou..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[150px]"
              required
            />
            <div className="p-4 border rounded-lg bg-card/50">
                 <label htmlFor="file-upload" className="block text-sm font-medium text-muted-foreground mb-2">Anexar imagens (opcional)</label>
                 {user && (
                    <ImageUpload 
                        agentId={user.uid}
                        propertyId={`support-ticket-${messageId}`}
                        onUploadComplete={handleUploadComplete}
                        multiple
                        currentImageUrl={imageUrls}
                    />
                 )}
                <p className="text-xs text-muted-foreground mt-2">Você pode anexar até 5 imagens (prints de tela, etc).</p>
            </div>

            <Button type="submit" disabled={loading} size="lg" className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Enviando...</> : 'Enviar Mensagem'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <MessagesHistory />

    </div>
  );
}
