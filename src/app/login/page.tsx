
'use client';

import React, { useState, useEffect } from 'react';
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
import { useAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, useUser, googleProvider, signInWithPopup, saveUserToFirestore } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { FirebaseError } from 'firebase/app';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useDemo } from '@/context/DemoContext';

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


const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.6-1.977,12.674-5.238l-5.404-4.282C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.28-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l5.404,4.282C39.99,35.036,44,28.891,44,20C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
  );

function LoginPageContent() {
    const { toast } = useToast();
    const auth = useAuth();
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    useEffect(() => {
        // Now, this effect only redirects if a real user logs in.
        // The demo redirection is handled by the RootLayout.
        if (!isUserLoading && user) {
            router.replace('/dashboard');
        }
    }, [user, isUserLoading, router]);

    const loginForm = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const signUpForm = useForm<z.infer<typeof signUpSchema>>({
        resolver: zodResolver(signUpSchema),
        defaultValues: { displayName: "", siteName: "", accountType: "corretor", email: "", password: "", confirmPassword: "" },
    });

    const handleAuthError = (error: FirebaseError) => {
        let title = "Erro de Autenticação";
        let description = "Ocorreu um erro inesperado. Tente novamente.";

        switch (error.code) {
            case 'auth/cancelled-popup-request':
            case 'auth/popup-closed-by-user':
                return; 
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
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
            case 'auth/account-exists-with-different-credential':
                title = "Conta já existe";
                description = "Já existe uma conta com este e-mail. Tente fazer login com o método original (ex: E-mail e Senha).";
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
            // O useEffect cuidará do redirecionamento
        } catch (error) {
            handleAuthError(error as FirebaseError);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSignUp(values: z.infer<typeof signUpSchema>) {
        if (!auth) return;
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user;
            await saveUserToFirestore(user, {
                displayName: values.displayName,
                name: values.siteName,
                accountType: values.accountType,
            });
            
            toast({
                title: "Conta criada com sucesso!",
                description: "Redirecionando para o seu painel...",
            });
            // O useEffect cuidará do redirecionamento
        } catch (error) {
            handleAuthError(error as FirebaseError);
        } finally {
            setIsLoading(false);
        }
    }
    
    async function handleGoogleLogin() {
        if (!auth) return;
        setIsGoogleLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            await saveUserToFirestore(result.user, {
                displayName: result.user.displayName,
                name: result.user.displayName,
                accountType: 'corretor',
            });
            toast({ title: "Login bem-sucedido!" });
            // O useEffect cuidará do redirecionamento
        } catch (error) {
            handleAuthError(error as FirebaseError);
        } finally {
            setIsGoogleLoading(false);
        }
    }


    if (isUserLoading || user) {
        return (
             <div className="relative min-h-screen flex items-center justify-center p-4">
                 <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
             </div>
        )
    }


    return (
        <div className="relative min-h-screen flex items-center justify-center p-4">
            <Image
                src="https://images.unsplash.com/photo-1582407947304-fd86f028f716?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxyZWFsJTIwZXN0YXRlfGVufDB8fHx8MTc2MjI0NzU0OHww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Casa moderna com uma piscina"
                fill
                sizes="100vw"
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
                             <Button variant="outline" className="w-full mb-4" onClick={handleGoogleLogin} disabled={isGoogleLoading}>
                                {isGoogleLoading ? "Aguardando..." : <><GoogleIcon /> <span className="ml-2">Entrar com Google</span></>}
                            </Button>
                             <div className="flex items-center my-4">
                                <Separator className="flex-1" />
                                <span className="px-4 text-xs text-muted-foreground">OU</span>
                                <Separator className="flex-1" />
                            </div>
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
                            <Button variant="outline" className="w-full mb-4" onClick={handleGoogleLogin} disabled={isGoogleLoading}>
                                {isGoogleLoading ? "Aguardando..." : <><GoogleIcon /> <span className="ml-2">Continuar com Google</span></>}
                            </Button>
                             <div className="flex items-center my-4">
                                <Separator className="flex-1" />
                                <span className="px-4 text-xs text-muted-foreground">OU</span>
                                <Separator className="flex-1" />
                            </div>
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
                                         {isLoading ? 'Criando conta...' : 'Criar Conta com E-mail'}
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


export default function LoginPage() {
    return (
        // A Suspense boundary is needed to use useSearchParams in DemoRedirect
        <Suspense fallback={
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
            </div>
        }>
            <LoginPageContent />
        </Suspense>
    )
}
