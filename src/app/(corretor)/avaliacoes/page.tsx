
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import type { Review } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Star, ThumbsUp, Trash2, AlertTriangle, Smile, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { InfoCard } from '@/components/info-card';

function ReviewCard({ review, onApprove, onRemove }: { review: Review, onApprove: (id: string) => void, onRemove: (id: string) => void }) {
    const createdAt = review.createdAt ? format(new Date(review.createdAt), "d 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR }) : 'Data indisponível';

    return (
        <Card className={`transition-all ${review.approved ? 'bg-card' : 'bg-secondary/50 border-primary/50'}`}>
            <CardContent className="p-4">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                            <h4 className="font-bold">{review.name}</h4>
                            <div className="flex items-center gap-1 text-yellow-400">
                                {[...Array(review.rating)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                                {[...Array(5 - review.rating)].map((_, i) => <Star key={i} className="h-4 w-4" />)}
                            </div>
                        </div>
                        {review.comment && <p className="text-muted-foreground text-sm mb-2">{review.comment}</p>}
                        <span className="text-xs text-muted-foreground">{createdAt}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        {review.approved ? 
                            <Badge variant="secondary">Aprovado</Badge> :
                            <Badge>Pendente</Badge>
                        }
                    </div>
                </div>
                 <div className="flex justify-end items-center gap-2 mt-4 pt-4 border-t">
                    {!review.approved && (
                        <Button size="sm" variant="outline" onClick={() => onApprove(review.id)}>
                            <ThumbsUp className="mr-2 h-4 w-4" /> Aprovar
                        </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => onRemove(review.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Remover
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function AvaliacoesPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const reviewsCollection = useMemoFirebase(
        () => (user && firestore ? collection(firestore, `agents/${user.uid}/reviews`) : null),
        [user, firestore]
    );

    const loadReviews = useCallback(async () => {
        if (!reviewsCollection) return;

        setLoading(true);
        setError(null);
        try {
            const snap = await getDocs(query(reviewsCollection, orderBy('createdAt', 'desc')));
            const fetchedReviews = snap.docs.map(d => {
                const data = d.data();
                return { 
                    id: d.id, 
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
                } as Review
            });
            setReviews(fetchedReviews);
        } catch (err: any) {
            console.error(err);
            setError('Erro ao carregar avaliações.');
        } finally {
            setLoading(false);
        }
    }, [reviewsCollection]);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    const handleApprove = async (id: string) => {
        if (!user || !firestore) return;
        try {
            const ref = doc(firestore, `agents/${user.uid}/reviews`, id);
            await updateDoc(ref, { approved: true });
            loadReviews(); // Recarrega a lista
            toast({ title: "Avaliação aprovada!", description: "A avaliação agora está visível no seu site." });
        } catch (err) {
            console.error(err);
            toast({ title: "Erro ao aprovar", variant: "destructive" });
        }
    };

    const handleRemove = async (id: string) => {
        if (!user || !firestore) return;
        try {
            const ref = doc(firestore, `agents/${user.uid}/reviews`, id);
            await deleteDoc(ref);
            loadReviews(); // Recarrega a lista
            toast({ title: "Avaliação removida com sucesso." });
        } catch (err) {
            console.error(err);
            toast({ title: "Erro ao remover", variant: "destructive" });
        }
    };
    
    const hasApprovedReviews = reviews.some(r => r.approved);

    return (
        <div className="space-y-6">
            <InfoCard cardId="avaliacoes-info" title="Gerenciando a Reputação">
                <p>
                    As avaliações enviadas pelos seus clientes através do site público aparecerão aqui como "Pendentes".
                </p>
                <p>
                    Você tem total controle para <strong>Aprovar</strong> ou <strong>Remover</strong> cada uma. Apenas as avaliações que você aprovar serão exibidas na seção "O que nossos clientes dizem" do seu site.
                </p>
            </InfoCard>

            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2"><Star /> Gerenciar Avaliações</CardTitle>
                    <CardDescription>
                        Aprove, remova e gerencie as avaliações enviadas pelos seus clientes. As avaliações aprovadas aparecerão no seu site público.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!loading && !hasApprovedReviews && (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Site Público</AlertTitle>
                            <AlertDescription>
                                Enquanto você não tiver avaliações aprovadas, seu site público exibirá exemplos genéricos para manter uma aparência profissional.
                            </AlertDescription>
                        </Alert>
                    )}

                    {loading && (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex space-x-4 border rounded-lg p-4">
                                <div className="flex-1 space-y-3">
                                    <Skeleton className="h-5 w-1/4" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                                <Skeleton className="h-10 w-24" />
                            </div>
                            ))}
                        </div>
                    )}
                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Erro</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {!loading && !error && reviews.length === 0 && (
                        <div className="text-center py-16 rounded-lg border-2 border-dashed">
                            <Smile className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h2 className="text-2xl font-bold mt-4">Nenhuma avaliação encontrada</h2>
                            <p className="text-muted-foreground mt-2">
                            Seus clientes ainda não enviaram nenhuma avaliação.
                            </p>
                        </div>
                    )}
                    {!loading && !error && reviews.length > 0 && (
                        <div className="space-y-4">
                            {reviews.map(review => (
                                <ReviewCard key={review.id} review={review} onApprove={handleApprove} onRemove={handleRemove} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
