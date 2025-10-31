
'use client';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { BlogPost, Agent } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, User } from 'lucide-react';
import { useEffect, useState } from 'react';

type Props = {
    params: { agentId: string; postId: string };
};

export default function BlogPostPage({ params }: Props) {
  const { agentId, postId } = params;
  const firestore = useFirestore();
  const [agent, setAgent] = useState<Agent | null>(null);

  const postRef = useMemoFirebase(
    () => (firestore ? doc(firestore, `agents/${agentId}/blogPosts`, postId) : null),
    [firestore, agentId, postId]
  );
  
  const { data: post, isLoading: isPostLoading } = useDoc<BlogPost>(postRef);

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
  
  if (isPostLoading || !agent) {
      return (
           <>
                <Header />
                <main className="container mx-auto px-4 py-8 max-w-4xl">
                    <Skeleton className="h-12 w-3/4 mb-4" />
                    <Skeleton className="h-6 w-1/2 mb-8" />
                    <Skeleton className="h-80 w-full mb-8" />
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-5/6" />
                    </div>
                </main>
                <Footer />
           </>
      )
  }

  if (!post) {
      notFound();
  }
  
  const postDate = post.createdAt?.toDate ? format(post.createdAt.toDate(), "d 'de' MMMM, yyyy", { locale: ptBR }) : null;

  return (
    <>
        <Header agentName={agent.name} agentId={agentId} />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
            <article className="prose prose-invert lg:prose-xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4 !text-foreground">{post.title}</h1>
                <div className="flex items-center gap-4 text-muted-foreground mb-8">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{agent.displayName}</span>
                    </div>
                    {postDate && (
                         <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <time dateTime={post.createdAt.toDate().toISOString()}>{postDate}</time>
                        </div>
                    )}
                </div>

                {post.coverImageUrl && (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-8">
                        <Image src={post.coverImageUrl} alt={post.title} fill className="object-cover"/>
                    </div>
                )}
                
                {/* Render newlines correctly */}
                <div className="whitespace-pre-wrap leading-relaxed text-foreground/80">
                    {post.content}
                </div>
            </article>
        </main>
        <Footer />
    </>
  );
}
