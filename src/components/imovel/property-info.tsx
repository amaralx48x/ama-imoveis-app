
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Property } from "@/lib/data";
import { Bath, BedDouble, MapPin, Ruler } from "lucide-react";

interface PropertyInfoProps {
  property: Property;
}

export function PropertyInfo({ property }: PropertyInfoProps) {
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(property.price);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="text-2xl font-headline font-bold leading-tight pr-4">{property.title}</CardTitle>
            <Badge className="bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] text-primary-foreground border-none flex-shrink-0">
                {property.operation}
            </Badge>
        </div>
        <div className="flex items-center text-muted-foreground text-sm pt-2">
            <MapPin className="w-4 h-4 mr-1.5" />
            <span>{property.address}</span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-primary my-4 pb-4 border-b">
            {property.operation === 'Venda' ? formattedPrice : `${formattedPrice} /mês`}
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center justify-center gap-1">
                <Ruler className="w-6 h-6 text-primary/80" />
                <span className="font-semibold text-lg">{property.builtArea} m²</span>
                <span className="text-xs text-muted-foreground">Área</span>
            </div>
             <div className="flex flex-col items-center justify-center gap-1">
                <BedDouble className="w-6 h-6 text-primary/80" />
                <span className="font-semibold text-lg">{property.bedrooms}</span>
                <span className="text-xs text-muted-foreground">Quartos</span>
            </div>
             <div className="flex flex-col items-center justify-center gap-1">
                <Bath className="w-6 h-6 text-primary/80" />
                <span className="font-semibold text-lg">{property.bathrooms}</span>
                <span className="text-xs text-muted-foreground">Banheiros</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
