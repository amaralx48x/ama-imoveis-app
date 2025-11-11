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
import { useAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, useFirestore, useUser } from '@/firebase';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        <path d="M1 1h22v22H1z" fill="none"/>
    </svg>
);


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
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const loginForm = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const signUpForm = useForm<z.infer<typeof signUpSchema>>({
        resolver: zodResolver(signUpSchema),
        defaultValues: { displayName: "", siteName: "", accountType: "corretor", email: "", password: "", confirmPassword: "" },
    });

    // Redirect if user is already logged in
    useEffect(() => {
        if (!isUserLoading && user) {
            router.push('/dashboard');
        }
    }, [user, isUserLoading, router]);

     useEffect(() => {
        if (!auth) return;
        // Don't set loading if user is already logged in and we are about to redirect
        if (user) return;

        setIsGoogleLoading(true);
        getRedirectResult(auth)
            .then(async (result) => {
                if (!result || !result.user) {
                    setIsGoogleLoading(false);
                    return; // No redirect result, do nothing
                }
                
                const user = result.user;
                if (!firestore) return;

                const agentRef = doc(firestore, "agents", user.uid);
                const agentSnap = await getDoc(agentRef);

                if (!agentSnap.exists()) {
                    await setDoc(agentRef, {
                        id: user.uid,
                        displayName: user.displayName || 'Novo Usuário',
                        name: user.displayName ? `${user.displayName.split(' ')[0]} Imóveis` : 'Minha Imobiliária',
                        accountType: 'corretor',
                        description: "Edite sua descrição na seção Perfil do seu painel.",
                        email: user.email,
                        creci: '000000-F',
                        photoUrl: user.photoURL || '',
                        role: 'corretor',
                    });
                    toast({ title: "Bem-vindo(a)!", description: "Sua conta foi criada." });
                } else {
                    toast({ title: `Bem-vindo(a) de volta, ${user.displayName}!` });
                }

                router.push('/dashboard');

            }).catch((error) => {
                handleAuthError(error as FirebaseError);
            }).finally(() => {
                setIsGoogleLoading(false);
            });
    }, [auth, firestore, router, toast, user]);

    const handleAuthError = (error: FirebaseError) => {
        let title = "Erro de Autenticação";
        let description = "Ocorreu um erro inesperado. Tente novamente.";

        switch (error.code) {
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
            case 'auth/popup-closed-by-user':
                title = "Login Cancelado";
                description = "A janela de login com Google foi fechada antes da conclusão.";
                break;
            case 'auth/cancelled-popup-request':
            case 'auth/popup-blocked':
                title: "Pop-up Bloqueado";
                description: "O pop-up de login do Google foi bloqueado pelo navegador. Habilite os pop-ups para este site.";
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

            const agentRef = doc(firestore, "agents", user.uid);
            await setDoc(agentRef, {
                id: user.uid,
                displayName: values.displayName,
                name: values.siteName,
                accountType: values.accountType,
                description: "Edite sua descrição na seção Perfil do seu painel.",
                email: values.email,
                creci: '000000-F',
                photoUrl: '',
                role: 'corretor',
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
    
    async function handleGoogleSignIn() {
        if (!auth || !firestore) return;
        setIsGoogleLoading(true);

        const provider = new GoogleAuthProvider();
        try {
            await signInWithRedirect(auth, provider);
        } catch (error) {
            handleAuthError(error as FirebaseError);
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
                             <div className="relative my-6">
                                <Separator />
                                <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-card-foreground text-background text-xs px-2">OU</span>
                            </div>
                            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
                                <GoogleIcon /> {isGoogleLoading ? 'Aguarde...' : 'Entrar com Google'}
                            </Button>
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
