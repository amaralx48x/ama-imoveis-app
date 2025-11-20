// src/app/api/demo-snapshot/route.ts
import { NextResponse } from 'next/server';
import { getFirebaseServer } from '@/firebase/server-init';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

// Função para buscar dados de uma subcoleção
async function getSubCollection(firestore: any, collectionPath: string) {
    const querySnapshot = await getDocs(collection(firestore, collectionPath));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function GET() {
  try {
    const { firestore } = getFirebaseServer();

    const agentRef = doc(firestore, 'demo', 'agent');
    
    // Buscar todas as coleções em paralelo
    const [
        agentSnap,
        properties,
        customSections,
        reviews
    ] = await Promise.all([
        getDoc(agentRef),
        getSubCollection(firestore, 'demo/agent/properties'),
        getSubCollection(firestore, 'demo/agent/customSections'),
        getSubCollection(firestore, 'demo/agent/reviews'),
    ]);

    if (!agentSnap.exists()) {
        return NextResponse.json({ error: 'Dados de demonstração não encontrados.' }, { status: 404 });
    }

    const agentData = { id: agentSnap.id, ...agentSnap.data() };

    const demoState = {
      agent: agentData,
      properties: properties,
      customSections: customSections,
      reviews: reviews,
    };
    
    // Garantir que todos os dados são serializáveis
    const serializableData = JSON.parse(JSON.stringify(demoState, (key, value) => {
        // Converte Timestamps para string ISO
        if (value && typeof value === 'object' && value.hasOwnProperty('seconds') && value.hasOwnProperty('nanoseconds')) {
            return new Date(value.seconds * 1000).toISOString();
        }
        return value;
    }));

    return NextResponse.json(serializableData);

  } catch (error) {
    console.error('Erro ao buscar snapshot da demo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
