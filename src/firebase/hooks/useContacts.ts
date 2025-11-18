
'use client';
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { firestore } from "@/firebase";

export function useContacts(agentId: string | null) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!agentId || !firestore) {
      setContacts([]);
      setLoading(false);
      return;
    }
    const q = query(collection(firestore, "agents", agentId, "contacts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snapshot => {
      setContacts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, err => {
      setError(err);
      setLoading(false);
    });

    return () => unsub();
  }, [agentId, firestore]);

  return { contacts, loading, error };
}
