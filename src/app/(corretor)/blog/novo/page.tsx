
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Newspaper } from 'lucide-react';
import { useState, useMemo } from 'react';
import ImageUpload from '@/components/image-upload';
import Image from 'next/image';

const formSchema = z.object({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres."),
  content: z.string().min(50, "O conteúdo deve ter pelo menos 50 caracteres."),
  coverImageUrl: z.string().url("URL da imagem de capa inválida.").optional().or(z.literal('')),
});

export default function NovoPostPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  
  const postId = useMemo(() => uuidv4(), []);
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: '', content: '', coverImageUrl: '' },
  });

  const handleUploadComplete = (urls: string[]) => {
    if(urls[0]) {
      setCoverImageUrl(urls[0]);
      form.setValue('coverImageUrl', urls[0]);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) return;
    
    const postRef = doc(firestore, `agents/${user.uid}/blogPosts`, postId);
    
    try {
      await setDoc(postRef, {
        ...values,
        id: postId,
        agentId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Post Criado!",
        description: "Seu novo post foi publicado com sucesso.",
      });
      router.push('/blog');

    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao criar post", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild>
        <Link href="/blog">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para o Blog
        </Link>
      </Button>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2"><Newspaper/> Novo Post</CardTitle>
          <CardDescription>Crie um novo artigo para o seu blog.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Post</FormLabel>
                  <FormControl><Input placeholder="Os 5 melhores bairros para morar em..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormItem>
                <FormLabel>Imagem de Capa (Opcional)</FormLabel>
                {user && (
                    <ImageUpload
                        agentId={user.uid}
                        propertyId={`blog_${postId}`} // Use um prefixo para evitar conflitos
                        onUploadComplete={handleUploadComplete}
                    />
                )}
                {coverImageUrl && (
                    <div className="mt-4 relative w-full h-64 rounded-md overflow-hidden">
                        <Image src={coverImageUrl} alt="Pré-visualização da capa" fill className="object-cover" />
                    </div>
                )}
              </FormItem>

              <FormField control={form.control} name="content" render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo do Post</FormLabel>
                  <FormControl><Textarea placeholder="Comece a escrever sua matéria aqui..." className="min-h-[300px]" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <Button type="submit" size="lg" className="w-full">Publicar Post</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
