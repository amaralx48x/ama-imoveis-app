import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import type { Property } from "@/lib/data";
import type { ImagePlaceholder } from "@/lib/placeholder-images";

interface PropertyGalleryProps {
  property: Property;
  images: ImagePlaceholder[];
}

export function PropertyGallery({ property, images }: PropertyGalleryProps) {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <Carousel className="w-full">
          <CarouselContent>
            {images.map((image) => (
              <CarouselItem key={image.id}>
                <div className="relative aspect-video">
                  <Image
                    src={image.imageUrl}
                    alt={image.description || property.title}
                    fill
                    className="object-cover"
                    data-ai-hint={image.imageHint}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {images.length > 1 && (
            <>
              <CarouselPrevious className="absolute left-4" />
              <CarouselNext className="absolute right-4" />
            </>
          )}
        </Carousel>
      </CardContent>
    </Card>
  );
}
