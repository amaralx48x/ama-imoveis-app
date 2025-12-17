'use client';

import { XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CanceladoPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center p-8 max-w-lg mx-auto">
                <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                <h1 className="text-3xl font-bold font-headline text-foreground mb-2">Pagamento Cancelado</h1>
                <p className="text-muted-foreground mb-6">
                    A sua transação foi cancelada. Se você teve algum problema, por favor, tente novamente ou entre em contato com nosso suporte.
                </p>
                <div className="flex gap-4 justify-center">
                    <Button asChild variant="outline">
                        <Link href="/meu-plano">
                            Tentar Novamente
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/suporte">
                            Falar com Suporte
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
