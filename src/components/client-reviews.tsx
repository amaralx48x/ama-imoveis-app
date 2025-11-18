
'use client';
import type { Review } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Smile } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

interface ClientReviewsProps {
  reviews: Review[];
  agentId: string;
  onReviewSubmitted: () => void;
}

export function ClientReviews({ reviews, agentId, onReviewSubmitted }: ClientReviewsProps) {

  const getAvatarForReview = (reviewId: string) => {
    // Select a static avatar from placeholder data to ensure it works in production
    const clientAvatars = PlaceHolderImages.filter(img => img.id.startsWith('client-'));
    if (clientAvatars.length === 0) {
      return `https://picsum.photos/seed/default-client/100/100`; // Fallback
    }
    const hash = reviewId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = hash % clientAvatars.length;
    return clientAvatars[index].imageUrl;
  };

  return (
    <div id="avaliacoes">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12">
            <div className="mb-4 sm:mb-0">
                <h2 className="text-4xl md:text-5xl font-extrabold font-headline">
                    O que nossos <span className="text-gradient">Clientes</span> dizem
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
                    A satisfação dos nossos clientes é a nossa maior recompensa.
                </p>
            </div>
            <ReviewFormDialog agentId={agentId} onReviewSubmitted={onReviewSubmitted} />
        </div>

        {reviews.length === 0 && (
          <div className="text-center py-16 rounded-lg border-2 border-dashed">
            <Smile className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="text-xl font-bold mt-4">Nenhuma avaliação ainda</h3>
            <p className="text-muted-foreground mt-2">
                Seja o primeiro a deixar uma avaliação!
            </p>
          </div>
        )}
        
        <div className="space-y-6">
          {reviews.map((review) => {
            const avatarUrl = getAvatarForReview(review.id);
            return (
                <Card key={review.id} className="bg-card border-border/50 flex flex-col">
                <CardContent className="p-6">
                    <div className="flex text-yellow-400 mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                    {[...Array(5 - review.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5" />
                    ))}
                    </div>
                    {review.comment && <p className="text-muted-foreground italic">"{review.comment}"</p>}
                </CardContent>
                <CardHeader className="flex flex-row items-center gap-4 p-6 pt-0">
                    {avatarUrl && (
                        <div className="relative h-12 w-12 rounded-full overflow-hidden">
                             <Image src={avatarUrl} alt={`Avatar de ${review.name || 'cliente'}`} fill sizes="48px" className="object-cover" />
                        </div>
                    )}
                    <div>
                    <p className="font-semibold">{review.name}</p>
                    </div>
                </CardHeader>
                </Card>
            )
          })}
        </div>
    </div>
  );
}

const reviewFormSchema = z.object({
  name: z.string().min(2, { message: "O nome é obrigatório." }),
  email: z.string().email({ message: "Insira um e-mail válido." }).optional().or(z.literal('')),
  rating: z.coerce.number().min(1, "A nota mínima é 1 estrela").max(5, "A nota máxima é 5 estrelas"),
  comment: z.string().optional(),
});

interface ReviewFormDialogProps {
    agentId: string;
    onReviewSubmitted: () => void;
}

function StarRating({ value, onChange }: { value: number, onChange: (value: number) => void }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex space-x-1">
            {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                    <label key={ratingValue} className="cursor-pointer">
                        <input
                            type="radio"
                            name="rating"
                            value={ratingValue}
                            onClick={() => onChange(ratingValue)}
                            className="hidden"
                        />
                        <Star
                            className={`h-8 w-8 transition-colors ${
                                ratingValue <= (hover || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                            }`}
                            onMouseEnter={() => setHover(ratingValue)}
                            onMouseLeave={() => setHover(0)}
                        />
                    </label>
                );
            })}
        </div>
    );
}

export function ReviewFormDialog({ agentId, onReviewSubmitted }: ReviewFormDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof reviewFormSchema>>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      name: "",
      email: "",
      rating: 5,
      comment: "",
    },
  });
  
  const canSend = () => {
    if (typeof window === "undefined") return false;
    const key = `review_sent_${agentId}`;
    const last = localStorage.getItem(key);
    if (!last) return true;
    const ts = Number(last);
    // 24h = 86400000 ms
    return Date.now() - ts > 24 * 60 * 60 * 1000;
  };

  const markSent = () => {
     if (typeof window === "undefined") return;
    localStorage.setItem(`review_sent_${agentId}`, String(Date.now()));
  };

  async function onSubmit(values: z.infer<typeof reviewFormSchema>) {
    if (!firestore) {
      toast({ title: "Erro de conexão", variant: "destructive" });
      return;
    }
    if (!canSend()) {
      toast({
        title: "Limite de envio atingido",
        description: "Você já enviou uma avaliação para este corretor nas últimas 24 horas.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, `agents/${agentId}/reviews`), {
        name: values.name.trim(),
        email: values.email?.trim() || null,
        rating: values.rating,
        comment: values.comment?.trim() || null,
        approved: false,
        createdAt: serverTimestamp(),
      });
      markSent();
      toast({
          title: "Obrigado!",
          description: "Sua avaliação foi enviada e será exibida após aprovação."
      })
      setOpen(false); // Close dialog
      form.reset();
      onReviewSubmitted(); // Notify parent to reload reviews
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao enviar avaliação", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button variant="outline">Deixar uma Avaliação</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Deixe sua Avaliação</DialogTitle>
                <DialogDescription>Compartilhe sua experiência para ajudar outros clientes.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="rating"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nota</FormLabel>
                                <FormControl>
                                    <StarRating value={field.value} onChange={field.onChange} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Seu Nome</FormLabel>
                            <FormControl><Input placeholder="Ex: João Silva" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="comment"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Comentário (opcional)</FormLabel>
                            <FormControl><Textarea placeholder="Descreva sua experiência..." {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Seu E-mail (Opcional)</FormLabel>
                            <FormControl><Input placeholder="seu.email@exemplo.com" {...field} /></FormControl>
                            <FormDescription className="text-xs">Seu e-mail não será exibido publicamente.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
                    </Button>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
