
'use client';

import { useState } from 'react';
import type { Property, Agent } from '@/lib/data';
import PropertyFilters from '@/components/property-filters';
import { filterProperties, type Filters } from '@/lib/filter-logic';
import { PropertyCard } from '@/components/property-card';
import { getPropertyTypes } from '@/lib/data';
import { useRouter } from 'next/navigation';

interface AgentPageContentProps {
    allProperties: Property[];
    agent: Agent;
}

export function AgentPageContent({ allProperties, agent }: AgentPageContentProps) {
    const router = useRouter();

    const handleFilter = (filters: Filters) => {
        const queryParams = new URLSearchParams();
        
        // Add agentId to every search
        if (agent.id) {
            queryParams.set('agentId', agent.id);
        }

        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                queryParams.set(key, value);
            }
        });
        
        router.push(`/search-results?${queryParams.toString()}`);
    };

    const cities = agent.cities || [];
    const propertyTypes = getPropertyTypes();

    return (
        <>
            {/* The PropertyFilters component is now inside the Hero component, so this is not needed here. */}
        </>
    );
}
