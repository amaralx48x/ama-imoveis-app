
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useFirestore, useUser } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { detectLeadType } from "@/lib/lead-utils";

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  phone: z.string().optional(),
  message: z.string().min(10, { message: "A mensagem deve ter pelo menos 10 caracteres." }),
});

interface ContactFormProps {
    agentId: string;
    propertyId?: string;
    context?: string; // e.g., 'form:captacao' or 'ad:imovel'
    title?: string;
    description?: string;
    isDialog?: boolean;
    onFormSubmit?: () => void;
}

export function ContactForm({ agentId, propertyId, context, title, description, isDialog, onFormSubmit }: ContactFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: propertyId ? `Olá, tenho interesse no imóvel com ID ${propertyId}.` : "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !agentId) {
        toast({ title: "Erro", description: "Não foi possível identificar o destinatário.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    const leadType = detectLeadType(values.message, context);

    try {
      await addDoc(collection(firestore, 'agents', agentId, 'leads'), {
        name: values.name,
        email: values.email,
        phone: values.phone,
        message: values.message,
        propertyId: propertyId || null,
        createdAt: serverTimestamp(),
        status: 'unread',
        leadType: leadType,
        context: context || null,
      });

      toast({
        title: "Mensagem Enviada!",
        description: "Obrigado por entrar em contato. Retornaremos em breve.",
      });
      form.reset();
      onFormSubmit?.();

    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro ao Enviar",
        description: "Não foi possível enviar sua mensagem. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  const FormContainer = isDialog ? 'div' : Card;

  return (
    <FormContainer>
        <CardHeader className={isDialog ? "text-left p-0 mb-4" : "text-center"}>
            <CardTitle className={isDialog ? "text-xl font-bold" : "text-4xl md:text-5xl font-extrabold font-headline"}>
                 {title || <>Fale <span className="text-gradient">Conosco</span></>}
            </CardTitle>
            <CardDescription className={isDialog ? "text-sm" : "mt-4 text-lg text-muted-foreground max-w-2xl mx-auto"}>
                {description || "Tem alguma dúvida ou quer agendar uma visita? Preencha o formulário abaixo."}
            </CardDescription>
        </CardHeader>
        <CardContent className={isDialog ? "p-0" : ""}>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                        <Input placeholder="Seu nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                        <Input placeholder="seu.email@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Telefone (Opcional)</FormLabel>
                        <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </div>
                <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Mensagem</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="Escreva sua mensagem aqui..."
                        className="min-h-[120px]"
                        {...field}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity" disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                    </>
                ) : (
                    "Enviar Mensagem"
                )}
                </Button>
            </form>
            </Form>
        </CardContent>
    </FormContainer>
  );
}
