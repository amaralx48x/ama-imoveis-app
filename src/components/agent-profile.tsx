'use client';
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ImagePlaceholder } from "@/lib/placeholder-images";
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Agent } from '@/lib/data';
import { Skeleton } from "@/components/ui/skeleton";

interface AgentProfileProps {
  agentImage?: ImagePlaceholder;
}

export function AgentProfile({ agentImage }: AgentProfileProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const agentRef = useMemoFirebase(
      () => (firestore && user ? doc(firestore, 'agents', user.uid) : null),
      [firestore, user]
  );
  const { data: agentData, isLoading: isAgentLoading } = useDoc<Agent>(agentRef);

  const aboutYouTitle = agentData?.accountType === 'imobiliaria' ? 'Nós' : 'Mim';
  const displayName = agentData?.displayName || 'Ana Maria Almeida';
  const creci = agentData?.creci || '123456-F';
  const description = agentData?.description || 'Com mais de 10 anos de experiência no mercado imobiliário, minha missão é ajudar você a encontrar o lar perfeito. Acredito que cada cliente é único e merece um atendimento personalizado, transparente e eficiente. Estou aqui para guiar você em cada passo da jornada, seja na compra, venda ou aluguel do seu imóvel.';

  return (
    <section className="py-16 sm:py-24 bg-card/50" id="sobre">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="flex-shrink-0">
            {isAgentLoading ? (
              <Skeleton className="h-[200px] w-[200px] rounded-full" />
            ) : agentImage && (
              <Image
                src={agentImage.imageUrl}
                alt="Corretora de Imóveis"
                width={200}
                height={200}
                className="rounded-full object-cover border-4 border-primary shadow-lg"
                data-ai-hint={agentImage.imageHint}
              />
            )}
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-extrabold font-headline">
              Sobre <span className="text-gradient">{aboutYouTitle}</span>
            </h2>
             {isAgentLoading ? (
                <div className="mt-4 space-y-2">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
             ) : (
                <>
                    <p className="mt-4 text-2xl font-semibold text-primary">{displayName}</p>
                    <p className="text-muted-foreground font-medium">CRECI {creci}</p>
                </>
             )}
            
            {isAgentLoading ? (
                <div className="mt-6 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            ) : (
                <p className="mt-6 text-lg text-muted-foreground max-w-xl">
                    {description}
                </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
