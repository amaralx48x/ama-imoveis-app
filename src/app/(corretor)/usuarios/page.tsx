

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import type { Agent, SubUser } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { UserPlus, Trash2, Edit, Loader2, Users, Crown } from 'lucide-react';
import { usePlan } from '@/context/PlanContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const permissionLevels = [
    { value: '1', label: 'Nível 1 (Básico)' },
    { value: '2', label: 'Nível 2 (Intermediário)' },
    { value: '3', label: 'Nível 3 (Gerencial)' },
];

function SubUserForm({ onSave, existingUser, isMainUser = false }: { onSave: (user: Partial<SubUser> | { pin: string }) => void, existingUser?: SubUser | Agent | null, isMainUser?: boolean }) {
    const [name, setName] = useState('');
    const [creci, setCreci] = useState('');
    const [pin, setPin] = useState('');
    const [level, setLevel] = useState<SubUser['level']>('1');
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (open) {
            if (existingUser) {
                setName(existingUser.name || '');
                setCreci(existingUser.creci || '');
                if ('pin' in existingUser && existingUser.pin) {
                    setPin(existingUser.pin);
                }
                 if ('level' in existingUser && existingUser.level) {
                    setLevel(existingUser.level);
                }
            } else {
                setName('');
                setCreci('');
                setPin('');
                setLevel('1');
            }
        }
    }, [existingUser, open]);


    const handleSave = () => {
        if (!isMainUser && !name) {
             alert("O nome é obrigatório.");
            return;
        }
         if (!pin || pin.length !== 4) {
            alert("A senha (PIN de 4 dígitos) é obrigatória.");
            return;
        }
        
        const id = existingUser ? existingUser.id : uuidv4();

        if (isMainUser) {
            onSave({ pin });
        } else {
             onSave({ id, name, creci, pin, level });
        }
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {existingUser ? (
                     <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                ) : (
                    <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Adicionar Usuário
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{existingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
                    <DialogDescription>
                        {isMainUser ? 'Altere sua senha de acesso (PIN).' : 'Preencha os dados e defina o nível de permissão do corretor.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {!isMainUser && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome do Corretor</Label>
                                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Carlos Andrade" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="creci">CRECI</Label>
                                <Input id="creci" value={creci} onChange={e => setCreci(e.target.value)} placeholder="123456-F" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="level">Nível de Permissão</Label>
                                <Select value={level} onValueChange={(value) => setLevel(value as SubUser['level'])}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um nível" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {permissionLevels.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                     <div className="space-y-2">
                        <Label htmlFor="pin">Senha (PIN de 4 dígitos)</Label>
                        <Input id="pin" type="password" maxLength={4} value={pin} onChange={e => setPin(e.target.value)} placeholder="****" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave}>Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function UsuariosPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { limits, currentPropertiesCount } = usePlan();

  const agentRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'agents', user.uid) : null),
    [user, firestore]
  );
  
  const { data: agentData, isLoading: isAgentLoading, mutate } = useDoc<Agent>(agentRef);

  const subUsers = useMemo(() => agentData?.subUsers || [], [agentData]);

  const handleAddUser = async (newUser: Partial<SubUser>) => {
    if (!agentRef) return;
    
    // Ensure new user has a default level if not provided
    const userToSave = { ...newUser, level: newUser.level || '1' };

    try {
      await updateDoc(agentRef, {
        subUsers: arrayUnion(userToSave)
      });
      mutate();
      toast({ title: 'Usuário adicionado com sucesso!' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro ao adicionar usuário', variant: 'destructive' });
    }
  };
  
  const handleEditUser = async (updatedUser: SubUser) => {
    if (!agentRef || !subUsers) return;
    const newSubUsers = subUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
     try {
      await updateDoc(agentRef, { subUsers: newSubUsers });
      mutate();
      toast({ title: 'Usuário atualizado!' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro ao atualizar usuário', variant: 'destructive' });
    }
  };

  const handleEditMainUser = async (data: { pin: string }) => {
      if (!agentRef) return;
      try {
        await setDoc(agentRef, { pin: data.pin }, { merge: true });
        mutate();
        toast({ title: 'PIN do usuário principal atualizado!' });
      } catch (error) {
        console.error(error);
        toast({ title: 'Erro ao atualizar PIN', variant: 'destructive' });
      }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!agentRef || !subUsers) return;
    if (!window.confirm("Tem certeza que deseja remover este usuário?")) return;

    const userToDelete = subUsers.find(u => u.id === userId);
    if (!userToDelete) return;
    
    try {
      await updateDoc(agentRef, {
        subUsers: arrayRemove(userToDelete)
      });
      mutate();
      toast({ title: 'Usuário removido.' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro ao remover usuário', variant: 'destructive' });
    }
  };
  
  const getLevelLabel = (level?: SubUser['level']) => {
    return permissionLevels.find(p => p.value === level)?.label || 'Nível não definido';
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2"><Users/> Gerenciar Usuários</CardTitle>
          <CardDescription>Adicione, edite ou remova os corretores que têm acesso a este painel.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex justify-end mb-4">
                <SubUserForm onSave={(data) => handleAddUser(data as SubUser)} />
            </div>

            {isAgentLoading ? (
                 <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <div key={i} className="flex items-center justify-between p-4 border rounded-lg"><Loader2 className="h-5 w-5 animate-spin" /></div>)}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Card para o usuário principal */}
                    {agentData && (
                         <div className="flex items-center justify-between p-4 border-2 border-primary/50 rounded-lg bg-primary/5">
                            <div>
                                <p className="font-semibold text-lg flex items-center gap-2">
                                    {agentData.displayName} <Badge variant="secondary" className="bg-yellow-400/20 text-yellow-500 border-yellow-400/30"><Crown className="h-3 w-3 mr-1"/> Dono</Badge>
                                </p>
                                <p className="text-sm text-muted-foreground">Usuário Principal / Administrador da Conta</p>
                            </div>
                            <div className="flex gap-2">
                                <SubUserForm onSave={(data) => handleEditMainUser(data as {pin: string})} existingUser={agentData} isMainUser={true} />
                            </div>
                        </div>
                    )}
                    
                    {subUsers.map(subUser => (
                        <div key={subUser.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                            <div>
                                <p className="font-semibold text-lg flex items-center gap-2">{subUser.name} <Badge variant="outline">{getLevelLabel(subUser.level)}</Badge></p>
                                <p className="text-sm text-muted-foreground">CRECI: {subUser.creci || 'Não informado'}</p>
                            </div>
                            <div className="flex gap-2">
                                <SubUserForm onSave={(data) => handleEditUser(data as SubUser)} existingUser={subUser} />
                                <Button variant="destructive" size="icon" onClick={() => handleDeleteUser(subUser.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {subUsers.length === 0 && (
                        <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">Nenhum usuário adicional cadastrado.</p>
                            <p className="text-xs text-muted-foreground mt-1">Adicione corretores para trabalhar em equipe.</p>
                        </div>
                    )}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

