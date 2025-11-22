// IMPORTANT: This file should NOT have the 'use client' directive.
// It's intended for server-side use only.
import { getFirebaseServer } from "@/firebase/server-init";

/**
 * Fetches SEO data for a given page from the server-side.
 * This is safe to use in `generateMetadata` functions.
 * @param page - The identifier for the page's SEO document.
 * @returns The SEO data object or null if not found.
 */
export async function getSEO(page: string) {
  const { firestore } = getFirebaseServer();
  const ref = firestore.doc(`seo/${page}`);
  const snap = await ref.get();
  return snap.exists ? snap.data() : null;
}
