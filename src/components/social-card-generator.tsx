
'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateSocialCard } from '@/ai/flows/generate-social-card-flow';
import type { Property, Agent } from '@/lib/data';
import Image from 'next/image';
import { saveAs } from 'file-saver';


interface SocialCardGeneratorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
  agent: Agent;
}

export function SocialCardGeneratorDialog({ isOpen, onOpenChange, property, agent }: SocialCardGeneratorDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setGeneratedImageUrl(null);
    try {
        const propertyImageUrl = property.imageUrls?.[0];
        if (!propertyImageUrl) {
            throw new Error("O imóvel não possui uma imagem principal.");
        }
        
        const input = {
            propertyImageUrl,
            logoImageUrl: agent.siteSettings?.logoUrl,
            price: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.price),
            operation: property.operation,
        };

      const result = await generateSocialCard(input);
      
      if (result?.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
        toast({ title: 'Card gerado com sucesso!' });
      } else {
        throw new Error('A IA não retornou uma imagem.');
      }
    } catch (error: any) {
      console.error('Erro ao gerar card:', error);
      toast({
        title: 'Erro ao Gerar Card',
        description: error.message || 'Não foi possível se comunicar com a IA.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (generatedImageUrl) {
        saveAs(generatedImageUrl, `card_${property.id}.png`);
    }
  }

  // Reset state when dialog is closed
  const handleOpenChange = (open: boolean) => {
    if (!open) {
        setGeneratedImageUrl(null);
        setIsLoading(false);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles /> Gerador de Card para Redes Sociais</DialogTitle>
          <DialogDescription>
            Crie uma imagem profissional para seus Stories ou Feed com um clique.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center space-y-4 my-8">
            {isLoading && (
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <span>Aguarde, a IA está criando sua arte...</span>
                    <p className="text-xs text-center">Isso pode levar até 30 segundos.</p>
                </div>
            )}

            {!isLoading && generatedImageUrl && (
                <div className="w-full aspect-[9/16] relative rounded-lg overflow-hidden border">
                    <Image src={generatedImageUrl} alt="Card gerado para o imóvel" fill sizes="100%" />
                </div>
            )}
            
             {!isLoading && !generatedImageUrl && (
                <div className="flex flex-col items-center gap-4 text-center p-6 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Pronto para criar um card para o imóvel <span className="font-bold text-primary">{property.title}</span>?</p>
                    <Button onClick={handleGenerate}>
                        <Sparkles className="mr-2 h-4 w-4" /> Gerar Imagem com IA
                    </Button>
                </div>
            )}
        </div>

        {generatedImageUrl && !isLoading && (
            <Button onClick={handleDownload} className="w-full">
                <Download className="mr-2 h-4 w-4" /> Baixar Imagem
            </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
