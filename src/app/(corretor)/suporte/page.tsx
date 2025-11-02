
'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import { useFirestore, useUser, useFirebaseApp } from '@/firebase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { LifeBuoy, Loader2, Upload, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { v4 as uuidv4 } from 'uuid';

const faqItems = [
  {
    question: 'Como cadastrar um novo imóvel?',
    answer: 'Vá para a seção "Meus Imóveis" no menu lateral e clique no botão "Adicionar Imóvel". Preencha todos os campos do formulário e adicione as fotos. A primeira foto será a capa do anúncio.',
  },
  {
    question: 'Como faço para editar um imóvel já cadastrado?',
    answer: 'Na lista "Meus Imóveis", clique nos três pontinhos no canto do card do imóvel desejado e selecione a opção "Editar Imóvel".',
  },
  {
    question: 'Onde vejo os contatos dos clientes interessados?',
    answer: 'Todos os contatos gerados pelos formulários do seu site público ficam na "Caixa de Entrada". As mensagens não lidas são destacadas para sua atenção.',
  },
  {
    question: 'Como funcionam os planos?',
    answer: 'Você pode ver os detalhes e limites do seu plano atual na seção "Meu Plano". Lá você também pode simular a troca para um plano superior para liberar mais funcionalidades, como imóveis ilimitados e importação via CSV.',
  },
];

export default function SuportePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const { toast } = useToast();

  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length + files.length > 5) {
            toast({ title: 'Limite de 5 arquivos excedido.', variant: 'destructive'});
            return;
        }
        setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return toast({ title: 'A mensagem não pode estar vazia.', variant: 'destructive'});
    if (!user) return toast({ title: 'Usuário não autenticado.', variant: 'destructive'});

    setLoading(true);
    
    try {
      const messageId = uuidv4();
      const storage = getStorage(firebaseApp);
      
      const imageUrls = await Promise.all(
        files.map(async (file) => {
          const imageRef = ref(storage, `support-images/${messageId}/${file.name}`);
          await uploadBytes(imageRef, file);
          return getDownloadURL(imageRef);
        })
      );
      
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
      setFiles([]);
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Erro ao enviar mensagem', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
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
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
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
                 <Input 
                    id="file-upload"
                    type="file" 
                    multiple 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file:text-primary file:font-semibold"
                />
                <p className="text-xs text-muted-foreground mt-2">Você pode anexar até 5 imagens (prints de tela, etc).</p>
                {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {files.map((file, index) => (
                            <Badge key={index} variant="secondary" className="pl-3 pr-2 py-1 text-sm">
                                {file.name}
                                <button onClick={() => handleRemoveFile(index)} className="ml-2 rounded-full hover:bg-destructive/80 p-0.5" disabled={loading}>
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            <Button type="submit" disabled={loading} size="lg" className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Enviando...</> : 'Enviar Mensagem'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
