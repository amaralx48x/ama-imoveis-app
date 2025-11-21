import { getFirebaseServer } from "@/firebase/server-init";
import { doc, getDoc, collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { NextResponse } from 'next/server';
import type { Agent, Property, Review, CustomSection, Lead } from "@/lib/data";

const TEMPLATE_ID = 'default';

async function getSourceAgentId(firestore: any): Promise<string | null> {
    const templateRef = doc(firestore, 'production_templates', TEMPLATE_ID);
    const templateSnap = await getDoc(templateRef);
    if (!templateSnap.exists()) {
        console.error(`Production template '${TEMPLATE_ID}' not found.`);
        return null;
    }
    return templateSnap.data()?.sourceAgentId || null;
}

export async function GET() {
    const { firestore } = getFirebaseServer();

    try {
        const sourceAgentId = await getSourceAgentId(firestore);
        if (!sourceAgentId) {
            return NextResponse.json({ error: "Source agent configuration not found" }, { status: 500 });
        }

        const agentRef = doc(firestore, 'agents', sourceAgentId);
        const propertiesRef = collection(firestore, `agents/${sourceAgentId}/properties`);
        const sectionsRef = collection(firestore, `agents/${sourceAgentId}/customSections`);
        const reviewsRef = collection(firestore, `agents/${sourceAgentId}/reviews`);
        const leadsRef = collection(firestore, `agents/${sourceAgentId}/leads`);

        const [agentSnap, propertiesSnap, sectionsSnap, reviewsSnap, leadsSnap] = await Promise.all([
            getDoc(agentRef),
            getDocs(query(propertiesRef)), // Fetch all properties, filter on client if needed
            getDocs(query(sectionsRef, orderBy('order', 'asc'))),
            getDocs(query(reviewsRef, where('approved', '==', true), limit(10))),
            getDocs(query(leadsRef, orderBy('createdAt', 'desc'), limit(20)))
        ]);

        if (!agentSnap.exists()) {
            return NextResponse.json({ error: "Source agent data not found" }, { status: 404 });
        }

        const serializeDoc = (docSnap: any) => {
            if (!docSnap.exists()) return null;
            const data = docSnap.data();
            return JSON.parse(JSON.stringify({ ...data, id: docSnap.id }));
        };

        const serializeCollection = (collSnap: any) => {
            return collSnap.docs.map(serializeDoc).filter(Boolean);
        };

        const agent = serializeDoc(agentSnap) as Agent;
        const properties = serializeCollection(propertiesSnap) as Property[];
        const customSections = serializeCollection(sectionsSnap) as CustomSection[];
        const reviews = serializeCollection(reviewsSnap) as Review[];
        const leads = serializeCollection(leadsSnap) as Lead[];

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
