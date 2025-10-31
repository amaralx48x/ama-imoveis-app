
import type { Property } from "@/lib/data";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import { BedDouble, Bath, Ruler, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(property.price);

  // Use the first uploaded image, or a default placeholder if none exist.
  const imageUrl = property.imageUrls?.[0] || PlaceHolderImages.find(p => p.id === 'property-1-1')?.imageUrl || "https://picsum.photos/seed/default/600/400";
  const imageHint = "house exterior";
  
  const detailUrl = `/imovel/${property.id}?agentId=${property.agentId}`;

  return (
    <Card className="w-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 flex flex-col h-full bg-card">
      <CardHeader className="p-0 relative">
        <Link href={detailUrl} className="block cursor-pointer">
          <div className="relative w-full h-56">
            <Image
              src={imageUrl}
              alt={property.title}
              fill
              className="object-cover"
              data-ai-hint={imageHint}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </Link>
        <Badge className="absolute top-3 right-3 bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] text-primary-foreground border-none">
          {property.operation}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <Link href={detailUrl}>
            <h3 className="font-headline font-bold text-lg truncate hover:text-primary transition-colors cursor-pointer">{property.title}</h3>
        </Link>
        <div className="flex items-center text-muted-foreground text-sm mt-1">
          <MapPin className="w-4 h-4 mr-1.5" />
          <span>{property.city}</span>
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
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full" variant="outline">
            <Link href={detailUrl}>Ver Detalhes</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
