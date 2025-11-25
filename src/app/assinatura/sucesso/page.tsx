'use client';

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SucessoPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center p-8 max-w-lg mx-auto">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold font-headline text-foreground mb-2">Pagamento bem-sucedido!</h1>
                <p className="text-muted-foreground mb-6">
                    Obrigado por sua assinatura! Seu plano foi ativado. Você pode agora aproveitar todos os benefícios exclusivos.
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
