import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirebase } from '@/firebase/init'; // Use the clean init file

interface AdditionalAgentData {
    displayName?: string | null;
    name?: string | null;
    accountType?: 'corretor' | 'imobiliaria';
}

export const saveUserToFirestore = async (user: User, additionalData?: AdditionalAgentData) => {
    const { firestore } = initializeFirebase(); // Get a fresh instance here
    if (!user?.uid || !firestore) return;

    const userRef = doc(firestore, "agents", user.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        const agentData = {
            id: user.uid,
            displayName: additionalData?.displayName || user.displayName || 'Corretor sem nome',
            name: additionalData?.name || user.displayName || 'Imóveis', // Default site name
            accountType: additionalData?.accountType || 'corretor',
            description: "Edite sua descrição na seção Perfil do seu painel.",
            email: user.email,
            creci: '000000-F',
            photoUrl: user.photoURL || '',
            role: 'corretor',
            plan: 'corretor',
            createdAt: serverTimestamp(),
            siteSettings: {
                siteStatus: true,
                showFinancing: true,
                showReviews: true,
                theme: 'dark',
            }
        };
        await setDoc(userRef, agentData);
        console.log("Novo usuário criado no Firestore");
    }
};

export const googleProvider = new GoogleAuthProvider();
