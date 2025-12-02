// src/app/api/feed/casamineira/route.ts
import { getFirebaseServer } from '@/firebase/server-init';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import type { Property } from '@/lib/data';

function escapeXml(unsafe: string): string {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

function generateCasaMineiraXml(properties: Property[]) {
    const items = properties.map(p => {
        return `
    <ad>
        <id>${p.id}</id>
        <title>${escapeXml(p.title)}</title>
        <price>${p.price}</price>
        <description>${escapeXml(p.description)}</description>
        <location>
            <city>${escapeXml(p.city)}</city>
            <neighborhood>${escapeXml(p.neighborhood)}</neighborhood>
        </location>
        <attributes>
            <attribute name="bedrooms" value="${p.bedrooms}" />
            <attribute name="bathrooms" value="${p.bathrooms}" />
            <attribute name="garages" value="${p.garage}" />
            <attribute name="area" value="${p.builtArea}" />
        </attributes>
        <pictures>
            ${(p.imageUrls || []).map(url => `<picture><source>${escapeXml(url)}</source></picture>`).join('')}
        </pictures>
    </ad>
    `;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<real_estate>
    ${items}
</real_estate>
`;
    return xml;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agentId');

        if (!agentId) {
            return new NextResponse("agentId é um parâmetro obrigatório", { status: 400 });
        }
        
        const { firestore } = getFirebaseServer();
        const propertiesRef = collection(firestore, 'agents', agentId, 'properties');
        const q = query(propertiesRef, where('portalPublish.casamineira', '==', true), where('status', '==', 'ativo'));
        
        const snapshot = await getDocs(q);

        const properties: Property[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        
        const xml = generateCasaMineiraXml(properties);

        return new NextResponse(xml, {
            headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        });

    } catch (error) {
        console.error("Erro ao gerar feed Casa Mineira:", error);
        return new NextResponse("Erro interno ao gerar feed XML", { status: 500 });
    }
}

  