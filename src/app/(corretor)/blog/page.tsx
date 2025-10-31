
'use client';

import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { BlogPost } from '@/lib/data';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, PlusCircle, AlertTriangle, FileText, Trash2, Pencil } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

function PostItem({ post, onRemove }: { post: BlogPost, onRemove: (id: string) => void }) {
  const postDate = post.createdAt?.toDate ? format(post.createdAt.toDate(), "d 'de' MMMM, yyyy", { locale: ptBR }) : 'Data indisponível';
  
  return (
    <Card className="flex flex-col md:flex-row items-start gap-4 p-4 transition-all hover:bg-muted/50">
      {post.coverImageUrl && (
        <div className="relative w-full md:w-48 h-32 md:h-full flex-shrink-0 rounded-md overflow-hidden">
          <Image src={post.coverImageUrl} alt={post.title} fill className="object-cover" />
        </div>
      )}
      <div className="flex-grow">
        <span className="text-xs text-muted-foreground">{postDate}</span>
        <h3 className="font-bold text-lg">{post.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{post.content.substring(0, 150)}...</p>
      </div>
      <div className="flex items-center gap-2 self-start md:self-center flex-shrink-0">
        <Button asChild variant="outline" size="sm">
          <Link href={`/blog/editar/${post.id}`}>
            <Pencil className="mr-2 h-4 w-4" /> Editar
          </Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o post do seu blog.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onRemove(post.id)}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  )
}

export default function BlogPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const postsCollection = useMemoFirebase(
    () => (user && firestore ? collection(firestore, `agents/${user.uid}/blogPosts`) : null),
    [user, firestore]
  );
  
  const postsQuery = useMemoFirebase(
    () => (postsCollection ? query(postsCollection, orderBy('createdAt', 'desc')) : null),
    [postsCollection]
  );

  const { data: posts, isLoading, error } = useCollection<BlogPost>(postsQuery);

  const handleRemove = (id: string) => {
    if (!user || !firestore) return;
    const docRef = doc(firestore, `agents/${user.uid}/blogPosts`, id);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Post excluído!",
        description: "O post foi removido do seu blog.",
    });
    // The useCollection hook will automatically update the UI
  };

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2"><Newspaper />Gerenciar Blog</CardTitle>
          <CardDescription>Crie e edite posts para o blog do seu site público.</CardDescription>
        </div>
        <Button asChild>
          <Link href="/blog/novo">
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Post
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex space-x-4 border rounded-lg p-4">
                  <Skeleton className="h-24 w-32 rounded-md" />
                  <div className="flex-1 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                  </div>
              </div>
            ))}
          </div>
        )}
        {error && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>Não foi possível carregar os posts do blog.</AlertDescription>
            </Alert>
        )}
        {!isLoading && !error && posts?.length === 0 && (
          <div className="text-center py-16 rounded-lg border-2 border-dashed">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="text-2xl font-bold mt-4">Nenhum post encontrado</h2>
            <p className="text-muted-foreground mt-2">
               Clique em "Novo Post" para começar a escrever.
            </p>
          </div>
        )}
         {!isLoading && !error && posts && posts.length > 0 && (
            <div className="space-y-4">
                {posts.map(post => <PostItem key={post.id} post={post} onRemove={handleRemove} />)}
            </div>
         )}
      </CardContent>
    </Card>
  );
}
