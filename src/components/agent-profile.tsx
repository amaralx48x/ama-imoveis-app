import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ImagePlaceholder } from "@/lib/placeholder-images";

interface AgentProfileProps {
  agentImage?: ImagePlaceholder;
}

export function AgentProfile({ agentImage }: AgentProfileProps) {
  return (
    <section className="py-16 sm:py-24 bg-card/50" id="sobre">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="flex-shrink-0">
            {agentImage && (
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
              Sobre <span className="text-gradient">Mim</span>
            </h2>
            <p className="mt-4 text-2xl font-semibold text-primary">Ana Maria Almeida</p>
            <p className="text-muted-foreground font-medium">CRECI 123456-F</p>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Com mais de 10 anos de experiência no mercado imobiliário, minha missão é ajudar você a encontrar o lar perfeito. Acredito que cada cliente é único e merece um atendimento personalizado, transparente e eficiente. Estou aqui para guiar você em cada passo da jornada, seja na compra, venda ou aluguel do seu imóvel.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
