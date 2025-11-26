
'use client';

import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";


function SucessoContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get('session_id');
    const { toast } = useToast();

    useEffect(() => {
        if (sessionId) {
            toast({
                title: "Pagamento bem-sucedido!",
                description: "Seu plano foi ativado. Redirecionando para o painel..."
            });

            const timer = setTimeout(() => {
                router.replace('/dashboard');
            }, 3000); 

            return () => clearTimeout(timer);
        }
    }, [sessionId, router, toast]);

    if (!sessionId) {
        return (
            <div className="text-center p-8">
                <div>
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold font-headline text-foreground mb-2">Pagamento Realizado com Sucesso!</h1>
                    <p className="text-muted-foreground mb-6">
                        Seu plano foi ativado. Você já pode usar todos os benefícios.
                    </p>
                    <Button asChild>
                        <Link href="/dashboard">
                            Ir para o Painel
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="text-center p-8 max-w-lg mx-auto">
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
            <h1 className="text-3xl font-bold font-headline text-foreground mb-2">Processando sua assinatura...</h1>
            <p className="text-muted-foreground mb-6">
                Seu pagamento foi confirmado. Estamos finalizando a ativação do seu plano e redirecionando você para o painel.
            </p>
        </div>
    );
}


export default function SucessoPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Suspense fallback={
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Carregando...</span>
                </div>
            }>
                <SucessoContent />
            </Suspense>
        </div>
    )
}
