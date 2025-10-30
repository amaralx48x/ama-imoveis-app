import type { Review } from "@/lib/data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import type { ImagePlaceholder } from "@/lib/placeholder-images";

interface ClientReviewsProps {
  reviews: Review[];
  avatars: ImagePlaceholder[];
}

export function ClientReviews({ reviews, avatars }: ClientReviewsProps) {
  return (
    <section className="py-16 sm:py-24 bg-background" id="avaliacoes">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold font-headline">
            O que nossos <span className="text-gradient">Clientes</span> dizem
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            A satisfação dos nossos clientes é a nossa maior recompensa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <Card key={review.id} className="bg-card border-border/50 flex flex-col">
              <CardContent className="p-6 flex-grow">
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground italic">"{review.review}"</p>
              </CardContent>
              <CardHeader className="flex flex-row items-center gap-4 p-6 pt-0">
                <Avatar>
                  <AvatarImage src={avatars[index].imageUrl} alt={review.name} data-ai-hint={avatars[index].imageHint} />
                  <AvatarFallback>{review.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{review.name}</p>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
