
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseServer } from '@/firebase/server-init';
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { XMLParser } from 'fast-xml-parser';
import type { Property } from '@/lib/data';

// Helper function to safely access nested properties
const get = (obj: any, path: string, defaultValue: any = null) => {
    return path.split('.').reduce((acc, part) => acc && acc[part] !== undefined ? acc[part] : defaultValue, obj);
};

export async function POST(req: NextRequest) {
    const { firestore } = getFirebaseServer();
    let body;
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
    }

    const { agentId, xmlUrl } = body;

    if (!agentId || !xmlUrl) {
        return NextResponse.json({ error: 'agentId e xmlUrl são obrigatórios.' }, { status: 400 });
    }

    try {
        const xmlResponse = await fetch(xmlUrl);
        if (!xmlResponse.ok) {
            throw new Error(`Falha ao buscar XML: ${xmlResponse.statusText}`);
        }
        const xmlText = await xmlResponse.text();

        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "",
            textNodeName: "_text",
            isArray: (name, jpath, isLeafNode, isAttribute) => {
                // Ensure Imovel and Foto are always arrays
                return name === "Imovel" || name === "Foto";
            }
        });
        const jsonObj = parser.parse(xmlText);

        const imoveis = get(jsonObj, 'Carga.Imovel', []);
        
        if (!imoveis || imoveis.length === 0) {
            return NextResponse.json({ error: 'Nenhum imóvel encontrado no formato esperado (Carga > Imovel).' }, { status: 400 });
        }
        
        const batch = writeBatch(firestore);
        let importedCount = 0;

        for (const imovel of imoveis) {
            const propertyId = get(imovel, 'CodigoImovel', `imported_${Date.now()}_${Math.random()}`);
            const docRef = doc(firestore, `agents/${agentId}/properties`, propertyId);
            
            const imageUrls = (get(imovel, 'Fotos.Foto', []) || [])
                .map((foto: any) => get(foto, 'NomeArquivo', null))
                .filter(Boolean);

            const newProperty: Omit<Property, 'id'> = {
                title: get(imovel, 'Titulo', 'Título não informado'),
                description: get(imovel, 'Descricao', 'Descrição não informada'),
                price: Number(get(imovel, 'PrecoVenda') || get(imovel, 'PrecoLocacao', 0)),
                bedrooms: Number(get(imovel, 'Dormitorios', 0)),
                bathrooms: Number(get(imovel, 'Suites', 0)),
                garage: Number(get(imovel, 'Vagas', 0)),
                rooms: 0, // Not available in ZAP XML
                builtArea: Number(get(imovel, 'AreaUtil', 0)),
                totalArea: Number(get(imovel, 'AreaTotal', 0)),
                imageUrls: imageUrls,
                city: get(imovel, 'Cidade', 'Não informada'),
                neighborhood: get(imovel, 'Bairro', 'Não informado'),
                type: get(imovel, 'TipoImovel', 'Casa') as Property['type'],
                operation: get(imovel, 'PrecoVenda') ? 'Venda' : 'Aluguel',
                agentId: agentId,
                createdAt: serverTimestamp(),
                status: 'ativo',
                sectionIds: ['featured'],
            };
            
            batch.set(docRef, newProperty);
            importedCount++;
        }

        await batch.commit();

        return NextResponse.json({ message: 'Importação bem-sucedida!', importedCount });

    } catch (error: any) {
        console.error("Erro na importação de XML:", error);
        return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
    }
}
