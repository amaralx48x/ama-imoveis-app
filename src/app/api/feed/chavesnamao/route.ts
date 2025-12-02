// src/app/api/feed/chavesnamao/route.ts
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

function generateChavesNaMaoXml(properties: Property[]) {
    const items = properties.map(p => {
        return `
    <imovel>
        <id>${p.id}</id>
        <titulo>${escapeXml(p.title)}</titulo>
        <descricao>${escapeXml(p.description)}</descricao>
        <valor>${p.price}</valor>
        <cidade>${escapeXml(p.city)}</cidade>
        <bairro>${escapeXml(p.neighborhood)}</bairro>
        <quartos>${p.bedrooms}</quartos>
        <banheiros>${p.bathrooms}</banheiros>
        <vagas>${p.garage}</vagas>
        <area_util>${p.builtArea}</area_util>
        <fotos>
            ${(p.imageUrls || []).map(url => `<foto>${escapeXml(url)}</foto>`).join('')}
        </fotos>
    </imovel>
    `;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<imoveis>
    ${items}
</imoveis>
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
        const q = query(propertiesRef, where('portalPublish.chavesnamao', '==', true), where('status', '==', 'ativo'));
        
        const snapshot = await getDocs(q);

        const properties: Property[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        
        const xml = generateChavesNaMaoXml(properties);

        return new NextResponse(xml, {
            headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        });

    } catch (error) {
        console.error("Erro ao gerar feed Chaves na Mão:", error);
        return new NextResponse("Erro interno ao gerar feed XML", { status: 500 });
    }
}

  