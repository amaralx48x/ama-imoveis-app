
"use client";
import { useUser } from "@/firebase"; // seu hook
import { useContacts } from "@/firebase/hooks/useContacts";
import ContactCard from "@/components/contacts/ContactCard";
import ContactFormModal from "@/components/contacts/ContactFormModal";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Plus, Users, User, Building } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Contact } from "@/lib/data";


export default function ContactsPage() {
  const { user } = useUser();
  const agentId = user?.uid || null;
  const { contacts, loading, error } = useContacts(agentId);
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);

  const owners = contacts.filter(c => c.type === 'owner');
  const clients = contacts.filter(c => c.type === 'client');

  const handleEdit = (contact: Contact) => {
    setEditing(contact);
  }

  const handleCloseModal = () => {
    setEditing(null);
    setOpenNew(false);
  }

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
            <Users /> Contatos
          </CardTitle>
          <CardDescription>
            Gerencie sua carteira de proprietários e clientes. Mantenha as informações centralizadas e organizadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex justify-end">
             <Button onClick={() => setOpenNew(true)}>
                <Plus className="mr-2 h-4 w-4"/>
                Novo Contato
            </Button>
           </div>
        </CardContent>
      </Card>
      
       <Tabs defaultValue="owners">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="owners"><User className="mr-2 h-4 w-4"/> Proprietários</TabsTrigger>
          <TabsTrigger value="clients"><Building className="mr-2 h-4 w-4"/> Clientes</TabsTrigger>
        </TabsList>
        <TabsContent value="owners">
            <Card>
                 <CardContent className="pt-6">
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                        </div>
                     ) : owners.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">Nenhum proprietário cadastrado.</p>
                     ) : (
                        <div className="grid gap-4">
                        {owners.map(c => (
                            <ContactCard key={c.id} contact={c} onEdit={() => handleEdit(c)} agentId={agentId!} />
                        ))}
                        </div>
                    )}
                 </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="clients">
             <Card>
                 <CardContent className="pt-6">
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                        </div>
                     ) : clients.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">Nenhum cliente cadastrado.</p>
                     ) : (
                        <div className="grid gap-4">
                        {clients.map(c => (
                            <ContactCard key={c.id} contact={c} onEdit={() => handleEdit(c)} agentId={agentId!} />
                        ))}
                        </div>
                    )}
                 </CardContent>
            </Card>
        </TabsContent>
      </Tabs>


      <ContactFormModal open={openNew} onClose={handleCloseModal} agentId={agentId} />
      {editing && <ContactFormModal open={!!editing} onClose={handleCloseModal} agentId={agentId} initialData={editing} />}
    </div>
  );
}
