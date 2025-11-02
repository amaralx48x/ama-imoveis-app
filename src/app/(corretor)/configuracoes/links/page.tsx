
"use client";

import { useState, useEffect } from "react";
import {
  useFirestore,
  useUser,
  useDoc,
  useMemoFirebase,
} from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import type { Agent, SocialLink } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Plus, Trash, Link, Loader2, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import ImageUpload from "@/components/image-upload";
import Image from "next/image";

const availableIcons = [
  { label: "WhatsApp", value: "whatsapp", placeholder: "5511999999999" },
  { label: "Instagram", value: "instagram", placeholder: "seu_usuario" },
  { label: "Facebook", value: "facebook", placeholder: "https://facebook.com/seu_usuario" },
  { label: "LinkedIn", value: "linkedin", placeholder: "https://linkedin.com/in/seu_usuario" },
  { label: "Website", value: "globe", placeholder: "https://seusite.com" },
  { label: "Telefone", value: "phone", placeholder: "11999999999" },
  { label: "Localização", value: "map-pin", placeholder: "Endereço completo do escritório" },
  { label: "E-mail", value: "mail", placeholder: "seu@email.com" },
];

function LinksFormSkeleton() {
    return (
        <div className="space-y-4">
             {[...Array(3)].map((_, i) => (
                 <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-36" />
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-10" />
                 </div>
             ))}
        </div>
    )
}

export default function SocialLinksSettingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const agentRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, "agents", user.uid) : null),
    [user, firestore]
  );
  
  const { data: agentData, isLoading: isAgentLoading } = useDoc<Agent>(agentRef);

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (agentData?.siteSettings?.socialLinks) {
      setSocialLinks(agentData.siteSettings.socialLinks);
    } else if (!isAgentLoading) {
      setSocialLinks([]); // Ensure it's an empty array if not present
    }
  }, [agentData, isAgentLoading]);

  const handleAdd = () => {
    setSocialLinks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: "", url: "", icon: "globe" },
    ]);
  };

  const handleChange = (id: string, field: keyof SocialLink, value: string) => {
    setSocialLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, [field]: value } : link))
    );
  };
  
  const handleImageUpload = (id: string, urls: string[]) => {
      handleChange(id, "imageUrl", urls[0]);
  };

  const handleDelete = (id: string) => {
    setSocialLinks((prev) => prev.filter((link) => link.id !== id));
  };

  const handleSave = async () => {
    if (!agentRef) return;

    setIsSaving(true);
    try {
      await updateDoc(agentRef, { "siteSettings.socialLinks": socialLinks });
      toast({ title: "Links salvos com sucesso!" });
    } catch (e) {
      console.error("Erro ao salvar links", e);
      toast({ title: "Erro ao salvar os links", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                <Link /> Gerenciar Links e Contatos
            </CardTitle>
            <CardDescription>
                Adicione ou edite os links de contato e redes sociais que aparecerão no rodapé do seu site. A opção "Localização" é ideal para imobiliárias ou corretores com escritório físico.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4">
            <AnimatePresence>
            {isAgentLoading ? <LinksFormSkeleton /> : socialLinks.map((link, index) => {
                const currentIcon = availableIcons.find(i => i.value === link.icon);
                const isLocation = link.icon === 'map-pin';
                return (
                <motion.div
                    key={link.id}
                    className="flex flex-col gap-3 p-3 border rounded-lg bg-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    layout
                >
                    <div className="flex items-center gap-2 md:gap-3">
                        <Select
                        value={link.icon}
                        onValueChange={(value) => handleChange(link.id, "icon", value)}
                        >
                            <SelectTrigger className="w-[120px] md:w-[150px] flex-shrink-0">
                                <SelectValue placeholder="Ícone" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableIcons.map((i) => (
                                <SelectItem key={i.value} value={i.value}>
                                    {i.label}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                        placeholder="Nome (ex: Meu Instagram)"
                        value={link.label}
                        onChange={(e) => handleChange(link.id, "label", e.target.value)}
                        />
                        <Input
                        placeholder={currentIcon?.placeholder || "URL ou valor"}
                        value={link.url}
                        onChange={(e) => handleChange(link.id, "url", e.target.value)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(link.id)} className="text-destructive hover:bg-destructive/10">
                            <Trash className="w-4 h-4" />
                        </Button>
                    </div>
                    
                    {isLocation && user && (
                        <div className="flex items-center gap-4 pl-1 pt-2 border-t border-dashed">
                             {link.imageUrl && (
                                <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                                    <Image src={link.imageUrl} alt="Preview do endereço" fill className="object-cover" />
                                </div>
                             )}
                            <div className="flex-grow">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2"><ImageIcon className="w-4 h-4"/> Foto do Endereço (Opcional)</label>
                                <ImageUpload
                                    agentId={user.uid}
                                    onUploadComplete={(urls) => handleImageUpload(link.id, urls)}
                                />
                            </div>
                        </div>
                    )}
                </motion.div>
                )
            })}
            </AnimatePresence>
            </div>

            <div className="flex gap-2 justify-start border-t pt-6">
                <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" /> Adicionar Link
                </Button>
                <Button onClick={handleSave} disabled={isSaving || isAgentLoading} className="bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                {isSaving ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                    </>
                ) : "Salvar Alterações"}
                </Button>
            </div>
        </CardContent>
    </Card>
  );
}
