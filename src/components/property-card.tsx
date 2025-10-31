
import type { Property } from "@/lib/data";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import { BedDouble, Bath, Ruler, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "./ui/button";
import type { ImagePlaceholder } from "@/lib/placeholder-images";

interface PropertyCardProps {
  property: Property;
  imagePlaceholder: ImagePlaceholder;
}

export function PropertyCard({ property, imagePlaceholder }: PropertyCardProps) {
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(property.price);

  const imageUrl = imagePlaceholder?.imageUrl || "https://picsum.photos/seed/default/600/400";
  const imageHint = imagePlaceholder?.imageHint || "house exterior";

  return (
    <Card className="w-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 flex flex-col h-full bg-card">
      <CardHeader className="p-0 relative">
        <Link href={`/imovel/${property.id}`} className="block">
          <Image
            src={imageUrl}
            alt={property.title}
            width={600}
            height={400}
            className="w-full h-56 object-cover"
            data-ai-hint={imageHint}
          />
        </Link>
        <Badge className="absolute top-3 right-3 bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] text-primary-foreground border-none">
          {property.operation}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <Link href={`/imovel/${property.id}`}>
          <h3 className="font-headline font-bold text-lg truncate hover:text-primary transition-colors">{property.title}</h3>
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
          <Link href={`/imovel/${property.id}`}>
            Ver Detalhes
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
