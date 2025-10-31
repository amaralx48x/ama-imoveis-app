
'use client';
import type { Review } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Smile } from "lucide-react";


interface ClientReviewsProps {
  reviews: Review[];
}

export function ClientReviews({ reviews }: ClientReviewsProps) {
  return (
    <div id="avaliacoes-lista">
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold font-headline">
            O que nossos <span className="text-gradient">Clientes</span> dizem
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            A satisfação dos nossos clientes é a nossa maior recompensa.
          </p>
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
          {reviews.map((review) => (
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
                <div>
                  <p className="font-semibold">{review.name}</p>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
    </div>
  );
}


const reviewFormSchema = z.object({
  name: z.string().min(2, { message: "O nome é obrigatório." }),
  email: z.string().email({ message: "Insira um e-mail válido." }).optional().or(z.literal('')),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().optional(),
});


interface ReviewFormProps {
    agentId: string;
    onReviewSubmitted: () => void;
}

export function ReviewForm({ agentId, onReviewSubmitted }: ReviewFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success'>('idle');

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
      setSubmissionStatus('success');
      form.reset();
      onReviewSubmitted(); // Notify parent to reload reviews
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao enviar avaliação", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submissionStatus === 'success') {
    return (
      <Card className="sticky top-24">
        <CardHeader>
          <CardTitle>Obrigado!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Sua avaliação foi enviada e será exibida após a aprovação do corretor.</p>
          <Button onClick={() => setSubmissionStatus('idle')} className="mt-4">Enviar outra avaliação</Button>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle>Deixe sua Avaliação</CardTitle>
        <CardDescription>Compartilhe sua experiência para ajudar outros clientes.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="rating"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>Nota</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione uma nota" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="5">5 Estrelas — Excelente</SelectItem>
                        <SelectItem value="4">4 Estrelas — Muito Bom</SelectItem>
                        <SelectItem value="3">3 Estrelas — Bom</SelectItem>
                        <SelectItem value="2">2 Estrelas — Regular</SelectItem>
                        <SelectItem value="1">1 Estrela — Ruim</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentário</FormLabel>
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
      </CardContent>
    </Card>
  );
}
