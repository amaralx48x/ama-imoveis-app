
'use client';

import type { Property } from "@/lib/data";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import { BedDouble, Bath, Ruler, MapPin, MoreVertical, Pencil, Trash2, FolderSymlink, CheckCircle, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MarkAsSoldDialog } from "./mark-as-sold-dialog";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { PropertyPreviewDialog } from "./property-preview-dialog";


interface PropertyCardProps {
  property: Property;
  onDelete?: (id: string) => void;
  onStatusChange?: () => void;
}

export function PropertyCard({ property, onDelete, onStatusChange }: PropertyCardProps) {
  const router = useRouter();
  const [isSoldDialogOpen, setIsSoldDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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

  const isDashboard = !!onDelete;
  const isForSale = property.operation === 'Comprar';
  
  const CardContentTrigger = isDashboard ? 'div' : Link;

  return (
    <>
    <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
    <Card className="w-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 flex flex-col h-full bg-card">
      <CardHeader className="p-0 relative">
        <DialogTrigger asChild>
          <div className="block cursor-pointer">
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
        </DialogTrigger>
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
      <DialogTrigger asChild>
        <div className="p-4 flex-grow cursor-pointer">
            <h3 className="font-headline font-bold text-lg truncate hover:text-primary transition-colors">{property.title}</h3>
            <div className="flex items-center text-muted-foreground text-sm mt-1">
              <MapPin className="w-4 h-4 mr-1.5" />
              <span>{property.neighborhood}, {property.city}</span>
            </div>
            <p className="text-2xl font-bold text-primary my-4">
              {property.operation === 'Comprar' ? formattedPrice : `${formattedPrice} /mês`}
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
      </DialogTrigger>
      <CardFooter className="p-4 pt-0">
        <DialogTrigger asChild>
          <Button className="w-full" variant="outline">
              Ver Detalhes
          </Button>
        </DialogTrigger>
      </CardFooter>
    </Card>
      
      {isDashboard && (
          <PropertyPreviewDialog property={property} open={isPreviewOpen} onOpenChange={setIsPreviewOpen} />
      )}

    </Dialog>

    <MarkAsSoldDialog
        isOpen={isSoldDialogOpen}
        onOpenChange={setIsSoldDialogOpen}
        property={property}
        onConfirm={() => {
            setIsSoldDialogOpen(false);
            onStatusChange?.();
        }}
    />
    </>
  );
}
