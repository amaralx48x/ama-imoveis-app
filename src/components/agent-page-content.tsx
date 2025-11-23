
'use client';

import { useState } from 'react';
import type { Property, Agent } from '@/lib/data';
import PropertyFilters from '@/components/property-filters';
import { filterProperties, type Filters } from '@/lib/filter-logic';
import { PropertyCard } from '@/components/property-card';
import { getPropertyTypes } from '@/lib/data';

interface AgentPageContentProps {
    allProperties: Property[];
    agent: Agent;
}

export function AgentPageContent({ allProperties, agent }: AgentPageContentProps) {
    const [filteredProperties, setFilteredProperties] = useState<Property[]>(allProperties);

    const handleFilter = (filters: Filters) => {
        const result = filterProperties(allProperties, filters);
        setFilteredProperties(result);
    };

    const cities = agent.cities || [];
    const propertyTypes = getPropertyTypes();

    return (
        <>
            <PropertyFilters onFilter={handleFilter} agent={{...agent, cities}} propertyTypes={propertyTypes} />
            <section className="py-16 sm:py-24 bg-background" id="imoveis">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-extrabold font-headline">
                            Nossos <span className="text-gradient">Imóveis</span>
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                            Explore nosso portfólio completo de propriedades disponíveis.
                        </p>
                    </div>
                    {filteredProperties.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredProperties.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 rounded-lg border-2 border-dashed">
                            <h2 className="text-2xl font-bold mb-2">Nenhum imóvel encontrado</h2>
                            <p className="text-muted-foreground">Tente ajustar seus filtros ou limpar a busca.</p>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
