'use client';

import { AgentProfile } from "@/components/agent-profile";
import { ClientReviews } from "@/components/client-reviews";
import { ContactForm } from "@/components/contact-form";
import { FeaturedProperties } from "@/components/featured-properties";
import { Hero } from "@/components/hero";
import { getReviews } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Property } from '@/lib/data';
import { collection } from 'firebase/firestore';
import { Skeleton }from "@/components/ui/skeleton";

export default function Home() {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const propertiesCollection = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return collection(firestore, `agents/${user.uid}/properties`);
  }, [firestore, user]);

  const { data: properties, isLoading } = useCollection<Property>(propertiesCollection);
  
  const featuredProperties = properties?.filter(p => p.featured) || [];

  const reviews = getReviews();

  const propertyImages = featuredProperties.map(p => {
    const imageId = p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls[0] : p.images?.[0];
    const image = PlaceHolderImages.find(img => img.id === imageId);
    return image || PlaceHolderImages[0];
  });
  
  const agentImage = PlaceHolderImages.find(img => img.id === "agent-photo");
  const reviewAvatars = reviews.map(r => {
    const avatar = PlaceHolderImages.find(img => img.id === r.avatar);
    return avatar || PlaceHolderImages[0];
  });

  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-background');

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-theme(spacing.14)-theme(spacing.32))]">
        <Hero heroImage={heroImage} />
        {isLoading ? (
           <div className="container mx-auto px-4 py-16 sm:py-24">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex flex-col space-y-3">
                    <Skeleton className="h-[224px] w-full rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
           </div>
        ) : (
          <FeaturedProperties properties={featuredProperties} images={propertyImages} />
        )}
        <AgentProfile agentImage={agentImage} />
        <ClientReviews reviews={reviews} avatars={reviewAvatars} />
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
