// src/app/api/feed/tecimob/route.ts
import { getFirebaseServer } from '@/firebase/server-init';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import type { Property } from '@/lib/data';

function escapeXml(unsafe: string): string {
    if (typeof unsafe !== 'string' || !unsafe) return '';
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

function generateTecimobXml(properties: Property[]) {
    const items = properties.map(p => {
        return `
    <Property>
        <Id>${p.id}</Id>
        <Title>${escapeXml(p.title)}</Title>
        <Type>${escapeXml(p.type)}</Type>
        <Transaction>${escapeXml(p.operation)}</Transaction>
        <Price>${p.price}</Price>
        <City>${escapeXml(p.city)}</City>
        <Bedrooms>${p.bedrooms}</Bedrooms>
        <Bathrooms>${p.bathrooms}</Bathrooms>
        <Garage>${p.garage}</Garage>
        <Area>${p.builtArea}</Area>
        <Images>
            ${(p.imageUrls || []).map(url => `<Image>${escapeXml(url)}</Image>`).join('')}
        </Images>
    </Property>
    `;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Properties>
    ${items}
</Properties>
`;
    return xml;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agentId');
        const propertyId = searchParams.get('propertyId');

        if (!agentId) {
            return new NextResponse("agentId é um parâmetro obrigatório", { status: 400 });
        }
        
        const { firestore } = getFirebaseServer();
        const propertiesRef = collection(firestore, 'agents', agentId, 'properties');
        
        let properties: Property[] = [];

        if (propertyId) {
            const docRef = doc(firestore, `agents/${agentId}/properties`, propertyId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().portalPublish?.tecimob && docSnap.data().status === 'ativo') {
                properties.push({ id: docSnap.id, ...docSnap.data() } as Property);
            }
        } else {
            const q = query(propertiesRef, where('portalPublish.tecimob', '==', true), where('status', '==', 'ativo'));
            const snapshot = await getDocs(q);
            properties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        }

        const xml = generateTecimobXml(properties);

        return new NextResponse(xml, {
            headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        });

    } catch (error) {
        console.error("Erro ao gerar feed Tecimob:", error);
        return new NextResponse("Erro interno ao gerar feed XML", { status: 500 });
    }
}
