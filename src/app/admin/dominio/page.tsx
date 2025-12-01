
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat, Link as LinkIcon } from "lucide-react";
import { InfoCard } from '@/components/info-card';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const Step = ({ number, title, children }: { number: number, title: string, children: React.ReactNode }) => (
    <div className="flex gap-4">
        <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                {number}
            </div>
            <div className="flex-grow w-px bg-border my-2"></div>
        </div>
        <div className="pb-8">
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            <div className="text-muted-foreground space-y-2">{children}</div>
        </div>
    </div>
);

export default function DominioAdminPage() {
  const GCLOUD_CONSOLE_LINK = "https://console.cloud.google.com/apphosting/backends?project=ama-imveis-041125-945215-63275";

  return (
    <div className="space-y-6">
       <InfoCard cardId="dominio-info" title="Conectando seu Domínio Personalizado">
          <p>
            Conectar um domínio envolve configurar duas plataformas: o Google Cloud (onde seu app está hospedado) e seu provedor de domínio (onde você o comprou, como a HostGator).
          </p>
          <p>
            Este processo é manual e não pode ser automatizado pelo painel, pois envolve permissões de segurança e acesso a contas externas. Este guia detalha os passos necessários.
          </p>
        </InfoCard>
       <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
            <LinkIcon /> Conectar Domínio Personalizado
          </CardTitle>
          <CardDescription>
            Guia passo a passo para apontar seu domínio (ex: www.seusite.com.br) para esta aplicação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                <h2 className="text-xl font-bold mb-4">Passo 1: Iniciar no Google Cloud</h2>
                <p className="text-muted-foreground mb-4">Primeiro, vamos dizer ao Google qual domínio você quer usar. Ele nos fornecerá as "instruções" (registros DNS) para configurar na HostGator.</p>
                
                <Step number={1} title="Acesse o Painel do App Hosting">
                    <p>Clique no botão abaixo para ir diretamente à página de gerenciamento do seu App Hosting no Google Cloud. Certifique-se de estar logado na conta correta.</p>
                    <Button asChild>
                        <a href={GCLOUD_CONSOLE_LINK} target="_blank" rel="noopener noreferrer">
                            Abrir Painel do Google Cloud
                        </a>
                    </Button>
                </Step>

                <Step number={2} title="Adicione seu Domínio">
                    <p>Na página do App Hosting, procure e clique na aba <strong>"Domínios"</strong> e depois no botão <strong>"Adicionar domínio personalizado"</strong>.</p>
                    <p>Digite seu domínio (ex: seusite.com.br) e siga as instruções na tela.</p>
                </Step>

                <Step number={3} title="Copie os Registros DNS">
                    <p>O Google irá exibir uma lista de registros (do tipo A, TXT ou CNAME). Estas são as informações que você usará no painel da HostGator.</p>
                    <p><strong>Deixe esta página do Google Cloud aberta.</strong></p>
                </Step>
            </div>

            <Separator />
            
             <div>
                <h2 className="text-xl font-bold mb-4">Passo 2: Configurar na HostGator</h2>
                <p className="text-muted-foreground mb-4">Agora, vamos usar as informações do Google para configurar seu domínio na HostGator.</p>
                
                <Step number={4} title="Acesse a Edição de DNS na HostGator">
                    <p>Faça login no painel da HostGator, vá para a seção "Domínios" e encontre a opção para "Gerenciar DNS" ou "Editor de Zona DNS" do seu domínio.</p>
                </Step>

                <Step number={5} title="Adicione/Edite os Registros">
                    <p>No painel da HostGator, adicione ou edite os registros DNS exatamente como o Google Cloud instruiu no Passo 3. Você precisará copiar e colar os valores para os registros A, TXT e/ou CNAME.</p>
                </Step>
            </div>

            <Separator />

             <div>
                <h2 className="text-xl font-bold mb-4">Passo 3: Finalizar e Aguardar</h2>
                
                <Step number={6} title="Verifique e Aguarde">
                    <p>Volte para a página do Google Cloud e clique em "Verificar". O status mudará para "Pendente".</p>
                    <p>O processo de propagação do DNS pode levar de alguns minutos a algumas horas. Quando estiver concluído, o status mudará para "Conectado", e seu site estará no ar com o novo domínio!</p>
                </Step>
            </div>

        </CardContent>
      </Card>
    </div>
  );
}
