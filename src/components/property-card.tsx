
'use client';

import type { Property, Agent } from "@/lib/data";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import { BedDouble, Bath, Ruler, MapPin, MoreVertical, Pencil, Trash2, FolderSymlink, CheckCircle, Link2, Share, Printer, Sparkles, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "./ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { MarkAsSoldDialog } from "./mark-as-sold-dialog";
import { useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { SocialCardGeneratorDialog } from './social-card-generator';
import { PropertyPreviewDialog } from "./property-preview-dialog";
import { useContacts } from "@/firebase/hooks/useContacts";

const portals = [
  { id: 'zap', name: 'ZAP+' },
  { id: 'imovelweb', name: 'Imovelweb' },
  { id: 'casamineira', name: 'Casa Mineira' },
  { id: 'chavesnamao', name: 'Chaves na Mão' },
  { id: 'tecimob', name: 'Tecimob' },
];

interface PropertyCardProps {
  property: Property;
  onDelete?: (id: string) => void;
  onStatusChange?: () => void;
}

export function PropertyCard({ property, onDelete, onStatusChange }: PropertyCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [isSoldDialogOpen, setIsSoldDialogOpen] = useState(false);
  const [isSocialCardDialogOpen, setIsSocialCardDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const agentRef = useMemoFirebase(() => (
    firestore && user ? doc(firestore, `agents/${user.uid}`) : null
  ), [firestore, user]);

  const { contacts } = useContacts(user?.uid || null);

  const owner = contacts.find(c => c.id === property.ownerContactId);
  const tenant = contacts.find(c => c.id === property.tenantContactId);
  
  const { data: agentData } = useDoc<Agent>(agentRef);

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(property.price);

  const isValidUrl = (url: string | undefined): boolean => {
    return !!url && (url.startsWith('http://') || url.startsWith('https://'));
  }

  const firstImageUrl = property.imageUrls?.[0];
  const imageUrl = isValidUrl(firstImageUrl) 
    ? firstImageUrl 
    : `https://picsum.photos/seed/${property.id}/600/400`;
  
  const imageHint = "house exterior";
  
  const detailUrl = `/imovel/${property.id}?agentId=${property.agentId}`;

  const handleEdit = () => {
    router.push(`/imoveis/editar-imovel/${property.id}`);
  };

  const handleAssociate = () => {
    router.push(`/imoveis/editar/${property.id}`);
  };
  
  const handleDelete = () => {
    if (onDelete) {
      onDelete(property.id);
    }
  };
  
  const handleCopyToClipboard = (url: string, portalName: string) => {
    navigator.clipboard.writeText(url);
    toast({
        title: "Link Copiado!",
        description: `O link do imóvel para o portal ${portalName} foi copiado.`,
    });
  }

  const handlePrint = () => {
    window.open(`/imoveis/imprimir/${property.id}`, '_blank');
  };

  const isDashboard = !!onDelete;
  const isForSale = property.operation === 'Venda';
  
  const CardContentTrigger = isDashboard ? 'div' : Link;

  return (
    <>
    <Card className="w-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 flex flex-col h-full bg-card">
      <CardHeader className="p-0 relative">
        <div onClick={() => isDashboard && setIsPreviewOpen(true)} className="block cursor-pointer">
            <div className="relative w-full h-56">
              <Image
                src={imageUrl}
                alt={property.title || "Imagem do imóvel"}
                fill
                className="object-cover"
                data-ai-hint={imageHint}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
        </div>
        <div className="absolute top-3 flex justify-between w-full px-3">
          <Badge className="bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] text-primary-foreground border-none">
            {property.operation}
          </Badge>
           {isDashboard && (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-background/70 hover:bg-background">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                 <DropdownMenuItem onClick={() => setIsPreviewOpen(true)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Ficha Rápida
                 </DropdownMenuItem>
                 {property.status !== 'vendido' && property.status !== 'alugado' && (
                  <DropdownMenuItem onClick={() => setIsSoldDialogOpen(true)}>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    {isForSale ? 'Marcar como Vendido' : 'Marcar como Alugado'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar Imóvel
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => setIsSocialCardDialogOpen(true)}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar Post para Redes Sociais
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={handleAssociate}>
                  <FolderSymlink className="mr-2 h-4 w-4" />
                  Associar a Seção
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                  <Link href={detailUrl} target="_blank">
                    <Link2 className="mr-2 h-4 w-4" />
                    Ver Página Pública
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir Ficha Completa
                </DropdownMenuItem>
                 <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Share className="mr-2 h-4 w-4" />
                        <span>Integração</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                         {portals.map(portal => {
                            const feedUrl = `${window.location.origin}/api/feed/${portal.id}?agentId=${property.agentId}&propertyId=${property.id}`;
                            return (
                                <DropdownMenuItem key={portal.id} onClick={() => handleCopyToClipboard(feedUrl, portal.name)}>
                                    Copiar link para {portal.name}
                                </DropdownMenuItem>
                            )
                        })}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
           )}
        </div>
      </CardHeader>
      <div onClick={() => isDashboard && setIsPreviewOpen(true)} className="p-4 flex-grow cursor-pointer">
            <h3 className="font-headline font-bold text-lg truncate hover:text-primary transition-colors">{property.title}</h3>
            <div className="flex items-center text-muted-foreground text-sm mt-1">
              <MapPin className="w-4 h-4 mr-1.5" />
              <span>{property.neighborhood}, {property.city}</span>
            </div>
            <p className="text-2xl font-bold text-primary my-4">
              {property.operation === 'Venda' ? formattedPrice : `${formattedPrice} /mês`}
            </p>
            <div className="flex justify-around text-muted-foreground border-t border-b border-border py-3 text-sm">
              <div className="flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-primary/70" />
                <span>{property.bedrooms}</span>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="w-5 h-5 text-primary/70" />
                <span>{property.bathrooms}</span>
              </div>
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-primary/70" />
                <span>{property.builtArea} m²</span>
              </div>
            </div>
      </div>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full" variant="outline">
          <Link href={detailUrl}>
            Ver Detalhes
          </Link>
        </Button>
      </CardFooter>
    </Card>

    <MarkAsSoldDialog
        isOpen={isSoldDialogOpen}
        onOpenChange={setIsSoldDialogOpen}
        property={property}
        onConfirm={() => {
            setIsSoldDialogOpen(false);
            onStatusChange?.();
        }}
    />

    {agentData && (
       <SocialCardGeneratorDialog 
        isOpen={isSocialCardDialogOpen}
        onOpenChange={setIsSocialCardDialogOpen}
        property={property}
        agent={agentData}
      />
    )}
    {agentData && (
        <PropertyPreviewDialog 
            property={property}
            agent={agentData}
            owner={owner}
            tenant={tenant}
            open={isPreviewOpen}
            onOpenChange={setIsPreviewOpen}
        />
    )}
    </>
  );
}
