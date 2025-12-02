
'use client';

import { useState } from "react";
import { useContacts } from "@/firebase/hooks/useContacts";
import { useUser } from "@/firebase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, User, Users, Loader2 } from "lucide-react";
import ContactCard from "@/components/contacts/ContactCard";
import ContactFormModal from "@/components/contacts/ContactFormModal";
import type { Contact } from "@/lib/data";
import { InfoCard } from '@/components/info-card';
import { Skeleton } from "@/components/ui/skeleton";

function ContactsPageSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-10 w-10" />
                </div>
            ))}
        </div>
    )
}

export default function ContactsPage() {
  const { user } = useUser();
  const { contacts, loading, error } = useContacts(user?.uid || null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setModalOpen(true);
  };
  
  const handleAddNew = () => {
      setSelectedContact(null);
      setModalOpen(true);
  }

  return (
    <div className="space-y-6">
       <InfoCard cardId="contatos-info" title="Gerenciamento de Contatos">
          <p>
            Esta é sua agenda central. Cadastre e organize seus contatos (proprietários e clientes).
          </p>
          <p>
            Na próxima etapa, você poderá vincular estes contatos diretamente aos seus imóveis, facilitando o controle de quem são os donos das propriedades e quais clientes estão interessados.
          </p>
        </InfoCard>
       <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
              <Users /> Contatos
            </CardTitle>
            <CardDescription>
              Gerencie sua carteira de proprietários e clientes.
            </CardDescription>
          </div>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Contato
          </Button>
        </CardHeader>
        <CardContent>
           {loading ? (
             <ContactsPageSkeleton />
           ) : error ? (
             <div className="text-destructive text-center py-10">Erro ao carregar contatos.</div>
           ) : contacts.length === 0 ? (
             <div className="text-center py-16 rounded-lg border-2 border-dashed">
                <User className="mx-auto h-12 w-12 text-muted-foreground" />
                <h2 className="text-2xl font-bold mt-4">Nenhum contato adicionado</h2>
                <p className="text-muted-foreground mt-2">
                   Comece a organizar sua agenda clicando em "Novo Contato".
                </p>
            </div>
           ) : (
             <div className="space-y-4">
                {contacts.map(contact => (
                    <ContactCard 
                        key={contact.id}
                        contact={contact}
                        onEdit={() => handleEdit(contact)}
                        agentId={user?.uid || ""}
                    />
                ))}
             </div>
           )}
        </CardContent>
      </Card>
      <ContactFormModal 
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        agentId={user?.uid || null}
        initialData={selectedContact}
      />
    </div>
  );
}
