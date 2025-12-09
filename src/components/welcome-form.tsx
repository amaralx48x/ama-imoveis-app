
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Agent } from '@/lib/data';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
    siteName: z.string().min(3, { message: "O nome do site deve ter pelo menos 3 caracteres." }),
    accountType: z.enum(["corretor", "imobiliaria"], { required_error: "Selecione um tipo de conta."}),
    phone: z.string().optional(),
    creci: z.string().optional(),
});

interface WelcomeFormProps {
    agent: Agent;
    onProfileComplete: () => void;
}

export default function WelcomeForm({ agent, onProfileComplete }: WelcomeFormProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            siteName: agent.name || '',
            accountType: agent.accountType || 'corretor',
            phone: agent.phone || '',
            creci: agent.creci || '',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!user) return;
        setIsSubmitting(true);

        const agentRef = doc(firestore, 'agents', user.uid);
        
        try {
            await updateDoc(agentRef, {
                name: values.siteName,
                accountType: values.accountType,
                phone: values.phone,
                creci: values.creci,
                status: 'active'
            });
            toast({ title: "Perfil completo!", description: "Bem-vindo(a) à plataforma!"});
            onProfileComplete();
        } catch (error) {
            console.error("Error updating profile: ", error);
            toast({ title: "Erro ao salvar", description: "Não foi possível completar seu perfil.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold font-headline">Bem-vindo(a), {agent.displayName}!</CardTitle>
                    <CardDescription>
                        Só mais alguns detalhes para finalizarmos a configuração da sua conta.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="siteName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome do Site / Imobiliária</FormLabel>
                                        <FormControl><Input placeholder="Ex: Imobiliária Silva" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="accountType"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Você é um(a)...</FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="corretor" /></FormControl><FormLabel className="font-normal">Corretor(a)</FormLabel></FormItem>
                                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="imobiliaria" /></FormControl><FormLabel className="font-normal">Imobiliária</FormLabel></FormItem>
                                            </RadioGroup>
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
                                        <FormLabel>Telefone Principal (WhatsApp)</FormLabel>
                                        <FormControl><Input placeholder="(11) 99999-9999" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="creci"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CRECI (Opcional)</FormLabel>
                                        <FormControl><Input placeholder="123456-F" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Finalizando...</> : 'Concluir Cadastro'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
