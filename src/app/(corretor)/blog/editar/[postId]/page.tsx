
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
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Newspaper } from 'lucide-react';
import { useState, useEffect } from 'react';
import ImageUpload from '@/components/image-upload';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import type { BlogPost } from '@/lib/data';

const formSchema = z.object({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres."),
  content: z.string().min(50, "O conteúdo deve ter pelo menos 50 caracteres."),
  coverImageUrl: z.string().url("URL da imagem de capa inválida.").optional().or(z.literal('')),
});

export default function EditarPostPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const postId = params.postId as string;
  
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');

  const postRef = useMemoFirebase(
      () => (user && firestore && postId ? doc(firestore, `agents/${user.uid}/blogPosts`, postId) : null),
      [user, firestore, postId]
  );
  
  const { data: postData, isLoading: isPostLoading } = useDoc<BlogPost>(postRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: '', content: '', coverImageUrl: '' },
  });

  useEffect(() => {
    if (postData) {
        form.reset(postData);
        if(postData.coverImageUrl) {
            setCoverImageUrl(postData.coverImageUrl);
        }
    }
  }, [postData, form]);

  const handleUploadComplete = (urls: string[]) => {
    if(urls[0]) {
      setCoverImageUrl(urls[0]);
      form.setValue('coverImageUrl', urls[0]);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!postRef) return;
    
    updateDocumentNonBlocking(postRef, {
        ...values,
        updatedAt: serverTimestamp(),
    });

    toast({
    title: "Post Atualizado!",
    description: "Seu post foi atualizado com sucesso.",
    });
    router.push('/blog');
  }
  
  if(isPostLoading) {
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
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-40 w-full" />
                     <Skeleton className="h-64 w-full" />
                     <Skeleton className="h-12 w-32" />
                </CardContent>
            </Card>
        </div>
      )
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
          <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2"><Newspaper/> Editar Post</CardTitle>
          <CardDescription>Faça alterações no seu artigo.</CardDescription>
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
              
              <Button type="submit" size="lg" className="w-full">Salvar Alterações</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
