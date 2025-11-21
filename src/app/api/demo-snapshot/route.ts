import { getFirebaseServer } from "@/firebase/server-init";
import { doc, getDoc, collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { NextResponse } from 'next/server';
import type { Agent, Property, Review, CustomSection, Lead } from "@/lib/data";

const SOURCE_AGENT_ID = '4vEISo4pEORjFhv6RzD7eC42cgm2';

export async function GET() {
    const { firestore } = getFirebaseServer();

    try {
        const agentRef = doc(firestore, 'agents', SOURCE_AGENT_ID);
        const propertiesRef = collection(firestore, `agents/${SOURCE_AGENT_ID}/properties`);
        const sectionsRef = collection(firestore, `agents/${SOURCE_AGENT_ID}/customSections`);
        const reviewsRef = collection(firestore, `agents/${SOURCE_AGENT_ID}/reviews`);
        const leadsRef = collection(firestore, `agents/${SOURCE_AGENT_ID}/leads`);

        const [agentSnap, propertiesSnap, sectionsSnap, reviewsSnap, leadsSnap] = await Promise.all([
            getDoc(agentRef),
            getDocs(query(propertiesRef, where('status', 'not-in', ['vendido', 'alugado']))),
            getDocs(query(sectionsRef, orderBy('order', 'asc'))),
            getDocs(query(reviewsRef, where('approved', '==', true), limit(10))),
            getDocs(query(leadsRef, orderBy('createdAt', 'desc'), limit(20)))
        ]);

        if (!agentSnap.exists()) {
            return NextResponse.json({ error: "Source agent not found" }, { status: 404 });
        }

        // --- Data Serialization ---
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
