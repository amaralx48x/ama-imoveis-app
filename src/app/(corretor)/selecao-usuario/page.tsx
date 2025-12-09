
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import type { Agent, SubUser } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, UserCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { v4 as uuidv4 } from 'uuid';

function UserSelectionCard({ user, onSelect, isOnline }: { user: { id: string; name: string; photoUrl?: string; }, onSelect: () => void, isOnline: boolean }) {
    return (
        <Card 
            className={`cursor-pointer transition-all hover:border-primary hover:shadow-lg ${isOnline ? 'border-green-500/50 bg-green-500/5' : 'bg-card'}`}
            onClick={onSelect}
        >
            <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={user.photoUrl} alt={user.name} />
                    <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                    <p className="font-bold">{user.name}</p>
                    {isOnline && <p className="text-xs text-green-500">Sessão Ativa</p>}
                </div>
            </CardContent>
        </Card>
    );
}

export default function SelecaoUsuarioPage() {
    const { user: authUser, isUserLoading: isAuthLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [pin, setPin] = useState('');
    const [pinDialogOpen, setPinDialogOpen] = useState(false);
    const [deviceId] = useState(() => {
        if (typeof window === 'undefined') return '';
        let id = sessionStorage.getItem('deviceId');
        if (!id) {
            id = uuidv4();
            sessionStorage.setItem('deviceId', id);
        }
        return id;
    });

    const agentRef = useMemoFirebase(
        () => (authUser && firestore ? doc(firestore, 'agents', authUser.uid) : null),
        [authUser, firestore]
    );

    const { data: agentData, isLoading: isAgentLoading } = useDoc<Agent>(agentRef);

    useEffect(() => {
        // Redireciona se não houver sub-usuários, pois esta página não seria necessária.
        if (!isAgentLoading && agentData && (!agentData.subUsers || agentData.subUsers.length === 0)) {
            sessionStorage.setItem('subUserId', agentData.id); // Define a sessão para o usuário principal
            router.replace('/dashboard');
        }
    }, [agentData, isAgentLoading, router]);

    const handleSelectUser = (userToSelect: any) => {
        setSelectedUser(userToSelect);
        setPinDialogOpen(true);
    };

    const handlePinConfirm = async () => {
        if (!selectedUser || !agentRef) return;
        
        let isValid = false;
        if (selectedUser.id === agentData?.id) { // Usuário Principal
            isValid = true; // Dono da conta não precisa de PIN, mas vamos simular por consistência
            // Em um cenário real, você poderia pular a verificação de PIN para o dono.
        } else { // Sub-usuário
            isValid = selectedUser.pin === pin;
        }

        if (isValid) {
            sessionStorage.setItem('subUserId', selectedUser.id);
            sessionStorage.setItem('deviceId', deviceId);

            // Registrar sessão no Firestore
            try {
                const newSession = { subUserId: selectedUser.id, deviceId, lastSeen: serverTimestamp() };
                const existingSessions = agentData?.sessions || [];
                const otherSessions = existingSessions.filter(s => s.deviceId !== deviceId);
                await updateDoc(agentRef, { sessions: [...otherSessions, newSession] });
            } catch (e) {
                console.error("Falha ao registrar sessão:", e);
            }

            setPinDialogOpen(false);
            toast({ title: `Bem-vindo(a), ${selectedUser.name}!`});
            router.push('/dashboard');
        } else {
            toast({ title: "PIN Incorreto", variant: "destructive" });
        }
        setPin('');
    };

    const isLoading = isAuthLoading || isAgentLoading;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const allUsers = [
        { id: agentData?.id, name: agentData?.displayName, photoUrl: agentData?.photoUrl },
        ...(agentData?.subUsers || [])
    ].filter(u => u && u.id && u.name);

    const activeSessions = agentData?.sessions?.map(s => s.subUserId) || [];

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2"><UserCheck /> Quem está acessando?</CardTitle>
                    <CardDescription>Selecione seu usuário para iniciar a sessão no painel.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {allUsers.map(u => (
                        <UserSelectionCard 
                            key={u.id}
                            user={u as {id: string, name: string, photoUrl?:string}} 
                            onSelect={() => handleSelectUser(u)} 
                            isOnline={activeSessions.includes(u.id!)}
                        />
                    ))}
                </CardContent>
            </Card>

            <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Digite seu PIN de 4 dígitos</DialogTitle>
                        <DialogDescription>
                            Para confirmar o acesso como <span className="font-bold">{selectedUser?.name}</span>, por favor, insira sua senha de acesso.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="pin-input">PIN</Label>
                        <Input 
                            id="pin-input"
                            type="password"
                            maxLength={4}
                            value={pin}
                            onChange={e => setPin(e.target.value)}
                            className="text-center text-2xl tracking-[1.5rem]"
                            onKeyDown={(e) => e.key === 'Enter' && handlePinConfirm()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPinDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handlePinConfirm}>Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

