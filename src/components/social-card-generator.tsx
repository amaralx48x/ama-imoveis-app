'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateSocialCardPost } from '@/ai/flows/generate-social-card-flow';
import type { Property, Agent } from '@/lib/data';
import Image from 'next/image';
import { Textarea } from './ui/textarea';


interface SocialCardGeneratorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
  agent: Agent;
}

export function SocialCardGeneratorDialog({ isOpen, onOpenChange, property, agent }: SocialCardGeneratorDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPostText, setGeneratedPostText] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setGeneratedPostText(null);
    try {
      await generateSocialCardPost({} as any);
    } catch (error: any) {
      toast({
        title: 'Funcionalidade em Construção',
        description: "A geração de post por IA será reativada em breve.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = () => {
    if (generatedPostText) {
        navigator.clipboard.writeText(generatedPostText);
        toast({ title: 'Texto copiado para a área de transferência!' });
    }
  }

  // Reset state when dialog is closed
  const handleOpenChange = (open: boolean) => {
    if (!open) {
        setGeneratedPostText(null);
        setIsLoading(false);
    }
    onOpenChange(open);
  }
  
  const propertyImageUrl = property.imageUrls?.[0] || `https://picsum.photos/seed/${property.id}/600/400`;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles /> Gerador de Post para Redes Sociais</DialogTitle>
          <DialogDescription>
            Use a imagem principal do seu imóvel com uma legenda gerada por IA para criar um post rapidamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
            <div className="w-full aspect-square relative rounded-lg overflow-hidden border">
                <Image src={propertyImageUrl} alt={`Imagem principal de ${property.title}`} fill sizes="100%" className="object-cover" />
            </div>
            
            {isLoading && (
                <div className="flex flex-col items-center gap-2 text-muted-foreground h-24 justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span>Aguarde, a IA está escrevendo...</span>
                </div>
            )}

            {!isLoading && generatedPostText && (
                 <Textarea value={generatedPostText} readOnly className="h-40 text-sm" />
            )}
            
             {!isLoading && !generatedPostText && (
                <div className="flex flex-col items-center gap-4 text-center p-6 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Pronto para criar uma legenda para o imóvel <span className="font-bold text-primary">{property.title}</span>?</p>
                    <Button onClick={handleGenerate}>
                        <Sparkles className="mr-2 h-4 w-4" /> Gerar Legenda com IA
                    </Button>
                </div>
            )}
        </div>

        {generatedPostText && !isLoading && (
            <Button onClick={handleCopy} className="w-full">
                <Copy className="mr-2 h-4 w-4" /> Copiar Texto da Legenda
            </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
