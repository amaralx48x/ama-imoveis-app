
'use client';
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { Contact } from "@/lib/data";

export function useContacts(agentId: string | null) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    if (!agentId || !firestore) {
      setContacts([]);
      setLoading(false);
      return;
    }
    const q = query(collection(firestore, "agents", agentId, "contacts"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, snapshot => {
      setContacts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Contact)));
      setLoading(false);
    }, err => {
      console.error("Error fetching contacts:", err);
      setError(err);
      setLoading(false);
    });

    return () => unsub();
  }, [agentId, firestore]);

  return { contacts, loading, error };
}
