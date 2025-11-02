
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';
import { setDoc, doc } from 'firebase/firestore';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


const loginSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }),
});

const signUpSchema = z.object({
    displayName: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
    siteName: z.string().min(3, { message: "O nome do site deve ter pelo menos 3 caracteres." }),
    accountType: z.enum(["corretor", "imobiliaria"], { required_error: "Selecione um tipo de conta."}),
    email: z.string().email({ message: "Por favor, insira um email válido." }),
    password: z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres." }),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "As senhas não correspondem.",
    path: ["confirmPassword"],
});


export default function LoginPage() {
    const { toast } = useToast();
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const loginForm = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const signUpForm = useForm<z.infer<typeof signUpSchema>>({
        resolver: zodResolver(signUpSchema),
        defaultValues: { displayName: "", siteName: "", email: "", password: "", confirmPassword: "" },
    });
    
    const handleAuthError = (error: FirebaseError) => {
        let title = "Erro de Autenticação";
        let description = "Ocorreu um erro inesperado. Tente novamente.";

        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                title = "Credenciais Inválidas";
                description = "O e-mail ou a senha estão incorretos. Verifique e tente novamente.";
                break;
            case 'auth/email-already-in-use':
                title = "E-mail já Cadastrado";
                description = "Este e-mail já está sendo usado por outra conta.";
                break;
            case 'auth/weak-password':
                title = "Senha Fraca";
                description = "Sua senha precisa ter pelo menos 8 caracteres.";
                break;
            case 'auth/invalid-email':
                title = "E-mail Inválido";
                description = "O formato do e-mail fornecido não é válido.";
                break;
        }

        toast({
            title,
            description,
            variant: "destructive",
        });
    }

    async function handleLogin(values: z.infer<typeof loginSchema>) {
        if (!auth) return;
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, values.email, values.password);
            toast({
                title: "Login bem-sucedido!",
                description: "Redirecionando para o seu painel...",
            });
            router.push('/dashboard');
        } catch (error) {
            handleAuthError(error as FirebaseError);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSignUp(values: z.infer<typeof signUpSchema>) {
        if (!auth || !firestore) return;
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user;

            // Save agent info to Firestore
            const agentRef = doc(firestore, "agents", user.uid);
            await setDoc(agentRef, {
                id: user.uid,
                displayName: values.displayName,
                name: values.siteName,
                accountType: values.accountType,
                description: "Edite sua descrição na seção Perfil do seu painel.",
                email: values.email,
                creci: '000000-F', // Placeholder
                photoUrl: '', // Placeholder
            });
            
            toast({
                title: "Conta criada com sucesso!",
                description: "Redirecionando para o seu painel...",
            });
            router.push('/dashboard');
        } catch (error) {
            handleAuthError(error as FirebaseError);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4">
            <Image
                src="https://images.unsplash.com/photo-1582407947304-fd86f028f716?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxyZWFsJTIwZXN0YXRlfGVufDB8fHx8MTc2MjI0NzU0OHww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Casa moderna com uma piscina"
                fill
                className="object-cover -z-10 brightness-50"
                data-ai-hint="real estate"
                priority
            />
            <Tabs defaultValue="login" className="w-full max-w-md">
                <Card className="bg-background/80 backdrop-blur-sm border-white/20 shadow-lg animate-fade-in-up">
                    <CardHeader>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">Entrar</TabsTrigger>
                            <TabsTrigger value="signup">Criar Conta</TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    <CardContent>
                        <TabsContent value="login">
                            <CardHeader className='p-0 pb-6 text-center'>
                                <CardTitle className="text-2xl font-bold font-headline">Acesse sua Conta</CardTitle>
                                <CardDescription>Bem-vindo de volta! Insira seus dados.</CardDescription>
                            </CardHeader>
                            <Form {...loginForm}>
                                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                                    <FormField control={loginForm.control} name="email" render={({ field }) => (
                                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="seu.email@exemplo.com" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={loginForm.control} name="password" render={({ field }) => (
                                        <FormItem>
                                            <div className="flex justify-between items-center">
                                                <FormLabel>Senha</FormLabel>
                                                <Button variant="link" type="button" className="p-0 h-auto text-xs">Esqueci minha senha</Button>
                                            </div>
                                            <FormControl><Input type="password" placeholder="********" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity" disabled={isLoading}>
                                        {isLoading ? 'Entrando...' : 'Entrar'}
                                    </Button>
                                </form>
                            </Form>
                        </TabsContent>
                        <TabsContent value="signup">
                            <CardHeader className='p-0 pb-6 text-center'>
                                <CardTitle className="text-2xl font-bold font-headline">Crie sua Conta</CardTitle>
                                <CardDescription>Comece a gerenciar seus imóveis hoje mesmo.</CardDescription>
                            </CardHeader>
                            <Form {...signUpForm}>
                                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                                     <FormField control={signUpForm.control} name="displayName" render={({ field }) => (
                                        <FormItem><FormLabel>Seu Nome Completo</FormLabel><FormControl><Input placeholder="Ex: Ana Maria" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <FormField control={signUpForm.control} name="siteName" render={({ field }) => (
                                        <FormItem><FormLabel>Nome do Site/Imobiliária</FormLabel><FormControl><Input placeholder="Ex: Imobiliária Silva" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <FormField
                                        control={signUpForm.control}
                                        name="accountType"
                                        render={({ field }) => (
                                            <FormItem className="space-y-3">
                                            <FormLabel>Tipo de Conta</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex flex-row space-x-4"
                                                >
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                    <RadioGroupItem value="corretor" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                    Corretor(a)
                                                    </FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                    <RadioGroupItem value="imobiliaria" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                    Imobiliária
                                                    </FormLabel>
                                                </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                    <FormField control={signUpForm.control} name="email" render={({ field }) => (
                                        <FormItem><FormLabel>Email de Acesso</FormLabel><FormControl><Input placeholder="seu.email@exemplo.com" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={signUpForm.control} name="password" render={({ field }) => (
                                        <FormItem><FormLabel>Senha</FormLabel><FormControl><Input type="password" placeholder="Mínimo 8 caracteres" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <FormField control={signUpForm.control} name="confirmPassword" render={({ field }) => (
                                        <FormItem><FormLabel>Confirmar Senha</FormLabel><FormControl><Input type="password" placeholder="Repita a senha" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity" disabled={isLoading}>
                                         {isLoading ? 'Criando conta...' : 'Criar Conta'}
                                    </Button>
                                </form>
                            </Form>
                        </TabsContent>
                    </CardContent>
                </Card>
            </Tabs>
        </div>
    );
}
