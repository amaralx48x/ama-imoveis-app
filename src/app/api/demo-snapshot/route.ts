import { NextResponse } from 'next/server';
import { getAgent, getProperties, getReviews } from '@/lib/data';
import type { Agent, Property, Review, CustomSection, Lead } from "@/lib/data";


// Mock de dados para a demo
const getDemoLeads = (): Lead[] => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return [
         {
            id: 'lead1',
            name: 'Ana Carolina',
            email: 'ana.carolina@example.com',
            phone: '(11) 98765-4321',
            message: 'Olá, gostaria de agendar uma visita para o imóvel "Apartamento Luxuoso no Centro". Estou disponível amanhã à tarde.',
            propertyId: '1',
            status: 'unread',
            leadType: 'buyer',
            context: 'buyer:schedule-visit',
            createdAt: today.toISOString(),
            visitDate: new Date(today.setDate(today.getDate() + 1)).toISOString(),
            visitTime: "14:30",
            cpf: "123.456.789-00",
        },
        {
            id: 'lead2',
            name: 'Marcos Andrade',
            email: 'marcos.andrade@example.com',
            phone: '(19) 91234-5678',
            message: 'Tenho um imóvel na região do Taquaral e gostaria de anunciá-lo com vocês. Como podemos proceder?',
            propertyId: null,
            status: 'read',
            leadType: 'seller',
            context: 'form:captacao',
            createdAt: yesterday.toISOString(),
        },
    ]
}


export async function GET() {
    try {
        const agent = getAgent();
        const properties = getProperties();
        const reviews = getReviews();
        const leads = getDemoLeads();

        // Simula a estrutura de seções
        const customSections: CustomSection[] = [
            { id: 'section-1', title: 'Oportunidades Únicas', order: 1, createdAt: new Date().toISOString() },
        ];

        // Associa algumas propriedades à seção de destaque e à seção customizada
        properties[0].sectionIds = ['featured', 'section-1'];
        properties[1].sectionIds = ['featured'];
        properties[2].sectionIds = ['featured', 'section-1'];


        const snapshot = {
            agent,
            properties,
            customSections,
            reviews,
            leads,
        };

        return NextResponse.json(snapshot);

    } catch (error) {
        console.error("Failed to create demo snapshot:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
