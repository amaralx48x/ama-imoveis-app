
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseServer } from '@/firebase/server-init';
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { XMLParser } from 'fast-xml-parser';
import type { Property } from '@/lib/data';

// Helper function to safely access nested properties, especially with arrays
const get = (obj: any, path: string, defaultValue: any = null) => {
    return path.split('.').reduce((acc, part) => {
        if (acc === undefined || acc === null) return defaultValue;
        // Check for array index in path
        if (part.includes('[') && part.includes(']')) {
            const arrayName = part.substring(0, part.indexOf('['));
            const index = parseInt(part.substring(part.indexOf('[') + 1, part.indexOf(']')), 10);
            return acc[arrayName] ? acc[arrayName][index] : defaultValue;
        }
        return acc[part] !== undefined ? acc[part] : defaultValue;
    }, obj);
};


const mapTransactionType = (type: string): 'Venda' | 'Aluguel' => {
    if (type?.toLowerCase() === 'for rent') {
        return 'Aluguel';
    }
    return 'Venda';
}

const mapPropertyType = (type: string): Property['type'] => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('apartment')) return 'Apartamento';
    if (lowerType.includes('home') || lowerType.includes('house')) return 'Casa';
    if (lowerType.includes('chácara')) return 'Chácara';
    if (lowerType.includes('shed') || lowerType.includes('galpão')) return 'Galpão';
    if (lowerType.includes('office') || lowerType.includes('sala')) return 'Sala';
    if (lowerType.includes('kitnet')) return 'Kitnet';
    if (lowerType.includes('terrain') || lowerType.includes('terreno')) return 'Terreno';
    if (lowerType.includes('lot') || lowerType.includes('lote')) return 'Lote';
    return 'Casa'; // Default fallback
}

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
            attributeNamePrefix: "_",
            textNodeName: "_text",
             isArray: (name, jpath, isLeafNode, isAttribute) => {
                // Ensure these tags are always treated as arrays, even if there's only one
                return name === "Listing" || name === "Item" || name === "Feature";
            }
        });
        const jsonObj = parser.parse(xmlText);

        const listings = get(jsonObj, 'ListingDataFeed.Listings.Listing', []);

        if (!listings || listings.length === 0) {
            return NextResponse.json({ error: 'Nenhum imóvel (<Listing>) encontrado no formato VRSync.' }, { status: 400 });
        }
        
        const batch = writeBatch(firestore);
        let importedCount = 0;

        for (const listing of listings) {
            const propertyId = get(listing, 'ListingID', `imported_${Date.now()}_${Math.random()}`);
            const docRef = doc(firestore, `agents/${agentId}/properties`, propertyId);
            
            const images = get(listing, 'Media.Item', []) || [];
            const imageUrls = images
                .filter((item: any) => item._medium === 'image' && item._text)
                .map((item: any) => item._text);
            
            const details = get(listing, 'Details', {});
            const location = get(listing, 'Location', {});
            
            const price = get(details, 'ListPrice._text') || get(details, 'RentalPrice._text') || 0;

            const newProperty: Omit<Property, 'id'> = {
                title: get(listing, 'Title', 'Título não informado'),
                description: get(details, 'Description', 'Descrição não informada'),
                price: Number(price),
                bedrooms: Number(get(details, 'Bedrooms', 0)),
                bathrooms: Number(get(details, 'Bathrooms', 0)),
                garage: Number(get(details, 'Garage._text', 0)),
                rooms: 0, // Not available in VRSync, default to 0
                builtArea: Number(get(details, 'LivingArea._text', 0)),
                totalArea: Number(get(details, 'LotArea._text', 0)),
                imageUrls: imageUrls,
                city: get(location, 'City', 'Não informada'),
                neighborhood: get(location, 'Neighborhood', 'Não informado'),
                type: mapPropertyType(get(details, 'PropertyType')),
                operation: mapTransactionType(get(listing, 'TransactionType')),
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
