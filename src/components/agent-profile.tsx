'use client';
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ImagePlaceholder } from "@/lib/placeholder-images";
import type { Agent } from '@/lib/data';

interface AgentProfileProps {
  agent: Agent;
}

export function AgentProfile({ agent }: AgentProfileProps) {

  const aboutYouTitle = agent.accountType === 'imobiliaria' ? 'Nós' : 'Mim';
  const displayName = agent.displayName || 'Corretor(a)';
  const creci = agent.creci || '000000-F';
  const description = agent.description || 'Descrição não informada.';
  const photoUrl = agent.photoUrl;

  return (
    <section className="py-16 sm:py-24 bg-card/50" id="sobre">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="flex-shrink-0">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={`Foto de ${displayName}`}
                width={200}
                height={200}
                className="rounded-full object-cover border-4 border-primary shadow-lg"
              />
            ) : (
                 <div className="w-[200px] h-[200px] bg-muted rounded-full flex items-center justify-center border-4 border-primary shadow-lg">
                    <span className="text-5xl font-bold text-muted-foreground">{displayName.charAt(0)}</span>
                </div>
            )}
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-extrabold font-headline">
              Sobre <span className="text-gradient">{aboutYouTitle}</span>
            </h2>
            <p className="mt-4 text-2xl font-semibold text-primary">{displayName}</p>
            <p className="text-muted-foreground font-medium">CRECI {creci}</p>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
                {description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
