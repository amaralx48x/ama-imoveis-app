// src/app/api/feed/zap/route.ts
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

function generateZapXml(properties: Property[]) {
    const items = properties.map(p => {
        // ZAP expects 'Venda' or 'Locacao'
        const negotiationType = p.operation === 'Aluguel' ? 'Locacao' : 'Venda';
        return `
    <Imovel>
        <CodigoImovel>${p.id}</CodigoImovel>
        <TipoImovel>${escapeXml(p.type)}</TipoImovel>
        <SubTipoImovel>${escapeXml(p.type)}</SubTipoImovel>
        <UF>SP</UF> 
        <Cidade>${escapeXml(p.city)}</Cidade>
        <Bairro>${escapeXml(p.neighborhood)}</Bairro>
        <PrecoVenda>${negotiationType === 'Venda' ? p.price : ''}</PrecoVenda>
        <PrecoLocacao>${negotiationType === 'Locacao' ? p.price : ''}</PrecoLocacao>
        <Dormitorios>${p.bedrooms}</Dormitorios>
        <Suites>${p.bathrooms}</Suites> 
        <Vagas>${p.garage}</Vagas>
        <AreaUtil>${p.builtArea}</AreaUtil>
        <AreaTotal>${p.totalArea}</AreaTotal>
        <Descricao>${escapeXml(p.description)}</Descricao>
        <Fotos>
            ${(p.imageUrls || []).map(url => `<Foto><NomeArquivo>${escapeXml(url)}</NomeArquivo><Principal>N</Principal></Foto>`).join('')}
        </Fotos>
    </Imovel>
    `;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Carga>
    ${items}
</Carga>
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
        const q = query(propertiesRef, where('portalPublish.zap', '==', true), where('status', '==', 'ativo'));
        
        const snapshot = await getDocs(q);

        const properties: Property[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        
        const xml = generateZapXml(properties);

        return new NextResponse(xml, {
            headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        });

    } catch (error) {
        console.error("Erro ao gerar feed ZAP:", error);
        return new NextResponse("Erro interno ao gerar feed XML", { status: 500 });
    }
}

  