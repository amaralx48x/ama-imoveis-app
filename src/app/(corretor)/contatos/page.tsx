
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, writeBatch, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Contact } from '@/lib/data';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, Plus, Trash2, Edit, Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const contactFormSchema = z.object({
    name: z.string().min(2, "Nome é obrigatório"),
    cpf: z.string().optional(),
    phone: z.string().min(10, "Telefone é obrigatório"),
    email: z.string().email("Email inválido"),
    age: z.coerce.number().optional(),
    type: z.enum(['proprietario', 'cliente'], { required_error: "Selecione um tipo." }),
});

function ContactForm({ onSave, contact, onOpenChange }: { onSave: (data: z.infer<typeof contactFormSchema>, id?: string) => Promise<void>, contact?: Contact, onOpenChange: (open: boolean) => void }) {
    const form = useForm<z.infer<typeof contactFormSchema>>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: contact ? { ...contact, age: contact.age || undefined } : { type: 'proprietario' }
    });

    const onSubmit = async (data: z.infer<typeof contactFormSchema>) => {
        await onSave(data, contact?.id);
        form.reset();
        onOpenChange(false);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <DialogHeader>
                    <DialogTitle>{contact ? 'Editar Contato' : 'Adicionar Novo Contato'}</DialogTitle>
                    <DialogDescription>
                        Preencha os dados do seu contato.
                    </DialogDescription>
                </DialogHeader>

                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input placeholder="Nome do contato" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="email@exemplo.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(11) 99999-9999" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="cpf" render={({ field }) => (<FormItem><FormLabel>CPF (Opcional)</FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="age" render={({ field }) => (<FormItem><FormLabel>Idade (Opcional)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="proprietario">Proprietário</SelectItem>
                                    <SelectItem value="cliente">Cliente</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : 'Salvar Contato'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

function ContactList({ contacts, onEdit, onDelete }: { contacts: Contact[], onEdit: (contact: Contact) => void, onDelete: (id: string, name: string) => void }) {
    if (contacts.length === 0) {
        return <p className="text-center text-muted-foreground py-8">Nenhum contato encontrado.</p>;
    }
    return (
        <div className="space-y-3">
            {contacts.map(contact => (
                <div key={contact.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                    <div>
                        <p className="font-semibold">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => onEdit(contact)}><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="destructive" className="h-9 w-9" onClick={() => onDelete(contact.id, contact.name)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function ContatosPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | undefined>(undefined);

    const contactsCollection = useMemoFirebase(
        () => (user && firestore ? collection(firestore, `agents/${user.uid}/contacts`) : null),
        [user, firestore]
    );

    const { data: contacts, isLoading, error, mutate: mutateContacts } = useCollection<Contact>(contactsCollection);

    const proprietarios = useMemo(() => contacts?.filter(c => c.type === 'proprietario').sort((a, b) => a.name.localeCompare(b.name)) || [], [contacts]);
    const clientes = useMemo(() => contacts?.filter(c => c.type === 'cliente').sort((a, b) => a.name.localeCompare(b.name)) || [], [contacts]);

    const handleSaveContact = async (data: z.infer<typeof contactFormSchema>, id?: string) => {
        if (!user || !firestore) return;
        
        const contactId = id || uuidv4();
        const docRef = doc(firestore, `agents/${user.uid}/contacts`, contactId);

        const newContact: Omit<Contact, 'id'> = {
            ...data,
            agentId: user.uid,
            createdAt: id ? (editingContact?.createdAt || new Date()) : new Date(),
            age: data.age || 0,
        };

        try {
            await setDoc(docRef, { ...newContact, id: contactId }, { merge: true });
            mutateContacts();
            toast({ title: `Contato ${id ? 'atualizado' : 'criado'}!`, description: `O contato "${data.name}" foi salvo.` });
        } catch (err) {
            console.error(err);
            toast({ title: 'Erro ao salvar contato', variant: 'destructive' });
        }
    };

    const handleDeleteContact = async (id: string, name: string) => {
        if (!user || !firestore || !window.confirm(`Tem certeza que deseja excluir o contato "${name}"?`)) return;

        const docRef = doc(firestore, `agents/${user.uid}/contacts`, id);
        try {
            await deleteDoc(docRef);
            mutateContacts();
            toast({ title: 'Contato excluído!' });
        } catch (err) {
            console.error(err);
            toast({ title: 'Erro ao excluir contato', variant: 'destructive' });
        }
    };

    const handleOpenDialog = (contact?: Contact) => {
        setEditingContact(contact);
        setIsDialogOpen(true);
    };

    return (
        <Card>
            <CardHeader className="flex-row justify-between items-start">
                <div>
                    <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2"><Users /> Gerenciar Contatos</CardTitle>
                    <CardDescription>Adicione, edite e organize seus proprietários e clientes.</CardDescription>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> Novo Contato
                </Button>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="proprietarios">
                    <TabsList className="mb-4">
                        <TabsTrigger value="proprietarios">Proprietários ({proprietarios.length})</TabsTrigger>
                        <TabsTrigger value="clientes">Clientes ({clientes.length})</TabsTrigger>
                    </TabsList>
                    
                    {isLoading && (
                        <div className="space-y-3 mt-4">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-md" />)}
                        </div>
                    )}

                    {!isLoading && (
                        <>
                            <TabsContent value="proprietarios">
                                <ContactList contacts={proprietarios} onEdit={handleOpenDialog} onDelete={handleDeleteContact} />
                            </TabsContent>
                            <TabsContent value="clientes">
                                <ContactList contacts={clientes} onEdit={handleOpenDialog} onDelete={handleDeleteContact} />
                            </TabsContent>
                        </>
                    )}
                </Tabs>

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) setEditingContact(undefined);
                }}>
                    <DialogContent>
                        <ContactForm onSave={handleSaveContact} contact={editingContact} onOpenChange={setIsDialogOpen} />
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
