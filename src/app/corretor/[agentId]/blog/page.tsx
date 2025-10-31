
'use client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, getDoc, doc } from 'firebase/firestore';
import type { BlogPost, Agent } from '@/lib/data';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, AlertTriangle, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';

function PostCard({ post, agentId }: { post: BlogPost, agentId: string }) {
  const postDate = post.createdAt?.toDate ? format(post.createdAt.toDate(), "d 'de' MMMM, yyyy", { locale: ptBR }) : 'Data indisponível';
  
  return (
    <Link href={`/corretor/${agentId}/blog/${post.id}`}>
        <Card className="flex flex-col group overflow-hidden h-full transition-all hover:shadow-lg hover:-translate-y-1">
            {post.coverImageUrl && (
                <div className="relative w-full h-48 flex-shrink-0 overflow-hidden">
                <Image src={post.coverImageUrl} alt={post.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
            )}
            <CardContent className="p-4 flex-grow flex flex-col">
                <span className="text-xs text-muted-foreground">{postDate}</span>
                <h3 className="font-bold text-lg mt-1 group-hover:text-primary transition-colors flex-grow">{post.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{post.content.substring(0, 100)}...</p>
            </CardContent>
        </Card>
    </Link>
  )
}

type Props = {
    params: { agentId: string };
};

export default function BlogPublicPage({ params }: Props) {
  const { agentId } = params;
  const firestore = useFirestore();
  const [agent, setAgent] = useState<Agent | null>(null);

  const postsCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, `agents/${agentId}/blogPosts`) : null),
    [firestore, agentId]
  );
  
  const postsQuery = useMemoFirebase(
    () => (postsCollection ? query(postsCollection, orderBy('createdAt', 'desc')) : null),
    [postsCollection]
  );

  const { data: posts, isLoading, error } = useCollection<BlogPost>(postsQuery);

  useEffect(() => {
      const fetchAgent = async () => {
          if (!firestore) return;
          const agentRef = doc(firestore, 'agents', agentId);
          const agentSnap = await getDoc(agentRef);
          if (agentSnap.exists()) {
              setAgent({ id: agentSnap.id, ...agentSnap.data() } as Agent);
          } else {
              notFound();
          }
      };
      fetchAgent();
  }, [firestore, agentId]);


  return (
    <>
        <Header agentName={agent?.name} agentId={agentId} />
        <main className="min-h-screen container mx-auto px-4 py-8">
            <div className="mb-8 text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold font-headline">Blog de <span className="text-gradient">{agent?.name || 'Imóveis'}</span></h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                    Dicas, notícias e novidades do mercado imobiliário.
                </p>
            </div>

            {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                    <Skeleton className="h-[192px] w-full rounded-xl" />
                    <div className="space-y-2 p-4">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
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
                <h2 className="text-2xl font-bold mt-4">Blog em breve</h2>
                <p className="text-muted-foreground mt-2">
                Nenhum post foi publicado ainda. Volte em breve!
                </p>
            </div>
            )}
            {!isLoading && !error && posts && posts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map(post => <PostCard key={post.id} post={post} agentId={agentId} />)}
                </div>
            )}
        </main>
        <Footer />
    </>
  );
}
