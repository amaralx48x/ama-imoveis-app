
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
    sortBy?: 'price-asc' | 'price-desc';
}

/**
 * Normaliza uma string removendo acentos e convertendo para minúsculas.
 * @param str A string a ser normalizada.
 * @returns A string normalizada.
 */
function normalizeString(str: string | undefined | null): string {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize("NFD") // Decompõe os caracteres acentuados
        .replace(/[\u0300-\u036f]/g, ""); // Remove os diacríticos
}

export function filterProperties(properties: Property[], filters: Filters): Property[] {
  let filtered = properties;
  
  const {
      city, neighborhood, type, operation,
      minPrice, maxPrice, bedrooms, garage, keyword, sectionId, sortBy
    } = filters;
    
  // Keyword search: Treat the keyword input as a set of terms that must ALL be present.
  if (keyword) {
    const searchTerms = normalizeString(keyword).split(' ').filter(Boolean); // Split into words and remove empty ones
    
    filtered = filtered.filter(p => {
        // Concatenate all searchable text fields of a property into one string
        const propertyText = normalizeString(
            `${p.title} ${p.description} ${p.city} ${p.neighborhood} ${p.type} ${p.operation}`
        );
        // Check if all search terms are present in the property's text
        return searchTerms.every(term => propertyText.includes(term));
    });
  }

  // Apply structured filters with normalization for text fields
  if (city) {
    const normalizedCity = normalizeString(city);
    filtered = filtered.filter(p => normalizeString(p.city) === normalizedCity);
  }
  if (neighborhood) {
    const normalizedNeighborhood = normalizeString(neighborhood);
    filtered = filtered.filter(p => normalizeString(p.neighborhood).includes(normalizedNeighborhood));
  }
  if (type) {
      const normalizedType = normalizeString(type);
      filtered = filtered.filter(p => normalizeString(p.type) === normalizedType);
  }
  if (operation) {
      const normalizedOperation = normalizeString(operation);
      filtered = filtered.filter(p => normalizeString(p.operation) === normalizedOperation);
  }

  // Numerical and other filters
  if (minPrice) {
    filtered = filtered.filter(p => p.price >= Number(minPrice));
  }
  if (maxPrice) {
    filtered = filtered.filter(p => p.price <= Number(maxPrice));
  }
  if (bedrooms) {
    filtered = filtered.filter(p => p.bedrooms >= Number(bedrooms));
  }
  if (garage) {
    filtered = filtered.filter(p => p.garage >= Number(garage));
  }
  if (sectionId) {
    filtered = filtered.filter(p => (p.sectionIds || []).includes(sectionId));
  }

  // Sorting
  if (sortBy === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  }
  
  return filtered;
}
