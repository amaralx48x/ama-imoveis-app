import { AgentProfile } from "@/components/agent-profile";
import { ClientReviews } from "@/components/client-reviews";
import { ContactForm } from "@/components/contact-form";
import { FeaturedProperties } from "@/components/featured-properties";
import { Hero } from "@/components/hero";
import { getFeaturedProperties, getReviews } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Home() {
  const featuredProperties = getFeaturedProperties();
  const reviews = getReviews();

  const propertyImages = featuredProperties.map(p => {
    const image = PlaceHolderImages.find(img => img.id === p.images[0]);
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
      <Hero heroImage={heroImage} />
      <FeaturedProperties properties={featuredProperties} images={propertyImages} />
      <AgentProfile agentImage={agentImage} />
      <ClientReviews reviews={reviews} avatars={reviewAvatars} />
      <ContactForm />
    </>
  );
}
