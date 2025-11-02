
import type { Property } from "./data";

export type Filters = {
    city?: string;
    neighborhood?: string;
    type?: string;
    operation?: string;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    garage?: string;
    keyword?: string;
    agentId?: string;
    sectionId?: string;
}

export function filterProperties(properties: Property[], filters: Filters): Property[] {
  let filtered = properties;
  
  const {
      city, neighborhood, type, operation,
      minPrice, maxPrice, bedrooms, garage, keyword, sectionId
    } = filters;
    
  // Primary keyword search on title, city, neighborhood
  if (keyword) {
    const lowercasedKeyword = keyword.toLowerCase();
    filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(lowercasedKeyword) ||
        p.city.toLowerCase().includes(lowercasedKeyword) ||
        p.neighborhood.toLowerCase().includes(lowercasedKeyword) ||
        p.description.toLowerCase().includes(lowercasedKeyword)
    );
  }

  // Structured filters
  if (city) filtered = filtered.filter(p => p.city === city);
  if (neighborhood) filtered = filtered.filter(p => p.neighborhood.toLowerCase().includes(neighborhood.toLowerCase()));
  if (type) filtered = filtered.filter(p => p.type === type);
  if (operation) filtered = filtered.filter(p => p.operation === operation);
  if (minPrice) filtered = filtered.filter(p => p.price >= Number(minPrice));
  if (maxPrice) filtered = filtered.filter(p => p.price <= Number(maxPrice));
  if (bedrooms) filtered = filtered.filter(p => p.bedrooms >= Number(bedrooms));
  if (garage) filtered = filtered.filter(p => p.garage >= Number(garage));
  if (sectionId) filtered = filtered.filter(p => (p.sectionIds || []).includes(sectionId));
  
  return filtered;
}
