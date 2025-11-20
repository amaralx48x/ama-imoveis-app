
// src/app/api/demo-snapshot/route.ts
import { NextResponse } from 'next/server';
import { getFirebaseServer } from '@/firebase/server-init';
import { collection, getDocs, doc, getDoc, query, where, orderBy } from 'firebase/firestore';

// O ID do agente que servirá como base para a demonstração
const DEMO_AGENT_ID = '4vEISo4pEORjFhv6RzD7eC42cgm2';

// Função para buscar dados de uma subcoleção
async function getSubCollection(firestore: any, collectionPath: string) {
    const querySnapshot = await getDocs(query(collection(firestore, collectionPath), orderBy('createdAt', 'desc')));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function GET() {
  if (!DEMO_AGENT_ID) {
      return NextResponse.json({ error: 'ID do agente de demonstração não configurado.' }, { status: 500 });
  }

  try {
    const { firestore } = getFirebaseServer();

    const agentRef = doc(firestore, 'agents', DEMO_AGENT_ID);
    
    // Buscar todas as coleções em paralelo
    const [
        agentSnap,
        properties,
        customSections,
        reviews
    ] = await Promise.all([
        getDoc(agentRef),
        getSubCollection(firestore, `agents/${DEMO_AGENT_ID}/properties`),
        getSubCollection(firestore, `agents/${DEMO_AGENT_ID}/customSections`),
        getSubCollection(firestore, `agents/${DEMO_AGENT_ID}/reviews`),
    ]);

    if (!agentSnap.exists()) {
        return NextResponse.json({ error: 'Agente de demonstração não encontrado.' }, { status: 404 });
    }

    const agentData = { id: agentSnap.id, ...agentSnap.data() };

    const demoState = {
      agent: agentData,
      properties: properties,
      customSections: customSections,
      reviews: reviews.filter(r => (r as any).approved),
    };
    
    // Garantir que todos os dados são serializáveis (ex: converter Timestamps do Firestore)
    const serializableData = JSON.parse(JSON.stringify(demoState, (key, value) => {
        if (value && typeof value === 'object' && value.hasOwnProperty('seconds') && value.hasOwnProperty('nanoseconds')) {
            return new Date(value.seconds * 1000).toISOString();
        }
        return value;
    }));

    return NextResponse.json(serializableData);

  } catch (error) {
    console.error('Erro ao buscar snapshot da demo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao criar snapshot.' }, { status: 500 });
  }
}
