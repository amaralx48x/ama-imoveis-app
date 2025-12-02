// src/app/api/feed/imovelweb/route.ts
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

function generateImovelWebXml(properties: Property[]) {
    const items = properties.map(p => {
        return `
    <inmueble>
        <codigoInmueble>${p.id}</codigoInmueble>
        <tipoOperacion>${p.operation === 'Venda' ? 'Venta' : 'Alquiler'}</tipoOperacion>
        <tipoInmueble>${escapeXml(p.type)}</tipoInmueble>
        <direccion>
            <localidad>${escapeXml(p.city)}</localidad>
            <barrio>${escapeXml(p.neighborhood)}</barrio>
            <provincia>SP</provincia>
        </direccion>
        <precio>${p.price}</precio>
        <titulo>${escapeXml(p.title)}</titulo>
        <descripcion>${escapeXml(p.description)}</descripcion>
        <superficie>${p.builtArea}</superficie>
        <cantidadDormitorios>${p.bedrooms}</cantidadDormitorios>
        <cantidadBanos>${p.bathrooms}</cantidadBanos>
        <cantidadCocheras>${p.garage}</cantidadCocheras>
        <fotos>
            ${(p.imageUrls || []).map(url => `<foto><url>${escapeXml(url)}</url></foto>`).join('')}
        </fotos>
    </inmueble>
    `;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<inmuebles>
    ${items}
</inmuebles>
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
             if (docSnap.exists() && docSnap.data().portalPublish?.imovelweb && docSnap.data().status === 'ativo') {
                properties.push({ id: docSnap.id, ...docSnap.data() } as Property);
            }
        } else {
            const q = query(propertiesRef, where('portalPublish.imovelweb', '==', true), where('status', '==', 'ativo'));
            const snapshot = await getDocs(q);
            properties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        }
        
        const xml = generateImovelWebXml(properties);

        return new NextResponse(xml, {
            headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        });

    } catch (error) {
        console.error("Erro ao gerar feed Imovelweb:", error);
        return new NextResponse("Erro interno ao gerar feed XML", { status: 500 });
    }
}
