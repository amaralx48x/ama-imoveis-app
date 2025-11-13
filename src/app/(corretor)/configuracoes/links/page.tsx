"use client";

import { useState, useEffect } from "react";
import {
  useFirestore,
  useUser,
  useDoc,
  useMemoFirebase,
} from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
import { Plus, Trash, Link as LinkIcon, Loader2, Image as ImageIcon, Power } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import ImageUpload from "@/components/image-upload";
import Image from "next/image";
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";


function SettingToggle({ 
    id, 
    label, 
    description, 
    isChecked, 
    onCheckedChange, 
    isLoading,
    linkValue,
    onLinkChange,
    linkPlaceholder,
    variant
}: { 
    id: string, 
    label: string, 
    description: string, 
    isChecked: boolean, 
    onCheckedChange: (checked: boolean) => void, 
    isLoading: boolean,
    linkValue?: string,
    onLinkChange?: (e: React.ChangeEvent<HTMLInputElement>) => void,
    linkPlaceholder?: string,
    variant?: "default" | "destructive"
}) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="space-y-1.5">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
            </div>
        )
    }
    
    return (
        <div className={`rounded-lg border p-4 space-y-4 ${variant === 'destructive' && isChecked === false ? 'border-destructive bg-destructive/5' : ''}`}>
            <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1.5">
                    <Label htmlFor={id} className={`text-base font-medium ${variant === 'destructive' && isChecked === false ? 'text-destructive' : ''}`}>{label}</Label>
                    <p id={`${id}-description`} className="text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
                <Switch
                    id={id}
                    checked={isChecked}
                    onCheckedChange={onCheckedChange}
                    aria-describedby={`${id}-description`}
                />
            </div>
            {onLinkChange && (
                 <div className="space-y-2">
                    <Label htmlFor={`${id}-link`} className="text-sm font-medium">Link Personalizado</Label>
                    <Input
                        id={`${id}-link`}
                        type="url"
                        placeholder={linkPlaceholder || "https://seu-link.com"}
                        value={linkValue}
                        onChange={onLinkChange}
                        disabled={!isChecked}
                        className="text-sm"
                    />
                     <p className="text-xs text-muted-foreground">Insira o link completo (ex: WhatsApp, página de financiamento, etc).</p>
                </div>
            )}
        </div>
    )
}

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

const availableIcons = [
  { value: 'whatsapp', label: 'WhatsApp', placeholder: '5511999999999' },
  { value: 'instagram', label: 'Instagram', placeholder: 'seu_usuario_sem_@' },
  { value: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/seu_usuario' },
  { value: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/seu_usuario' },
  { value: 'globe', label: 'Website', placeholder: 'https://seu-site.com' },
  { value: 'phone', label: 'Telefone', placeholder: '(11) 99999-9999' },
  { value: 'map-pin', label: 'Endereço', placeholder: 'Rua Exemplo, 123, Cidade' },
  { value: 'mail', label: 'E-mail', placeholder: 'contato@seu-email.com' },
];

type LinkState = SocialLink & { file?: File | null };

export default function SocialLinksSettingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const agentRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, "agents", user.uid) : null),
    [user, firestore]
  );
  
  const { data: agentData, isLoading: isAgentLoading, mutate } = useDoc<Agent>(agentRef);

  const [socialLinks, setSocialLinks] = useState<LinkState[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [siteSettings, setSiteSettings] = useState(agentData?.siteSettings);

  useEffect(() => {
    if (agentData?.siteSettings) {
      setSiteSettings(agentData.siteSettings);
      setSocialLinks(agentData.siteSettings.socialLinks || []);
    } else if (!isAgentLoading) {
      setSocialLinks([]);
      setSiteSettings({});
    }
  }, [agentData, isAgentLoading]);

  const handleAdd = () => {
    setSocialLinks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: "", url: "", icon: "globe" },
    ]);
  };

  const handleChange = (id: string, field: keyof LinkState, value: any) => {
    setSocialLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, [field]: value } : link))
    );
  };

  const handleDelete = (id: string) => {
    setSocialLinks((prev) => prev.filter((link) => link.id !== id));
  };
  
  const handleSettingChange = (key: string) => (value: boolean) => {
    if (!agentRef) return;
    
    // Optimistic UI update
    setSiteSettings(prev => ({...prev, [key]: value}));

    const updatePath = `siteSettings.${key}`;
    updateDocumentNonBlocking(agentRef, { [updatePath]: value });
    mutate(); // Re-fetch the data to ensure sync

    toast({
        title: "Configuração atualizada!",
        description: "A mudança será refletida no seu site público."
    });
};

const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (!agentRef) return;
    
    // Optimistic UI update for the input field
    setSiteSettings(prev => ({...prev, financingLink: value}));
    
    // Non-blocking update to Firestore (debounced or on blur would be even better)
    updateDocumentNonBlocking(agentRef, { 'siteSettings.financingLink': value });
    // We don't call mutate() here on every keystroke to avoid excessive reads.
}

  const handleSave = async () => {
    if (!agentRef || !user) return;

    setIsSaving(true);
    try {
        const storage = getStorage();
        const updatedLinks = await Promise.all(
            socialLinks.map(async (link) => {
                if (link.file) {
                    const filePath = `agents/${user.uid}/links/${link.id}_${link.file.name}`;
                    const fileRef = ref(storage, filePath);
                    await uploadBytes(fileRef, link.file);
                    const imageUrl = await getDownloadURL(fileRef);
                    const { file, ...rest } = link; // remove file from link object
                    return { ...rest, imageUrl };
                }
                const { file, ...rest } = link;
                return rest;
            })
        );
        
      await setDoc(agentRef, { 
        siteSettings: {
            ...siteSettings,
            socialLinks: updatedLinks,
        }
       }, { merge: true });

      setSocialLinks(updatedLinks); // Update state with new image URLs
      mutate();
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
                <LinkIcon /> Gerenciar Links e Exibição
            </CardTitle>
            <CardDescription>
                Adicione ou edite os links de contato, redes sociais e controle elementos de exibição do seu site.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                 <h3 className="text-xl font-bold font-headline mb-4">Status do Site</h3>
                 <div className="space-y-4">
                    <SettingToggle
                        id="siteStatus"
                        label="Site Público"
                        description="Quando inativo, seu site exibirá uma página de manutenção para visitantes. Você ainda poderá visualizá-lo por estar logado."
                        isChecked={siteSettings?.siteStatus ?? true}
                        onCheckedChange={handleSettingChange('siteStatus')}
                        isLoading={isAgentLoading}
                        variant="destructive"
                    />
                </div>
            </div>

            <Separator/>

            <div>
                <h3 className="text-xl font-bold font-headline mb-4">Controle de Botões</h3>
                <div className="space-y-4">
                    <SettingToggle
                        id="showFinancing"
                        label="Botão 'Simular Financiamento'"
                        description="Exibe um botão na página de detalhes do imóvel para uma ação personalizada."
                        isChecked={siteSettings?.showFinancing ?? true}
                        onCheckedChange={handleSettingChange('showFinancing')}
                        isLoading={isAgentLoading}
                        linkValue={siteSettings?.financingLink || ''}
                        onLinkChange={handleLinkChange}
                        linkPlaceholder="https://wa.me/5511999999999"
                    />
                </div>
            </div>

            <Separator/>
            
            <div>
                 <h3 className="text-xl font-bold font-headline mb-4">Links e Redes Sociais</h3>
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
                                <div className="flex-grow">
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2"><ImageIcon className="w-4 h-4"/> Foto do Endereço (Opcional)</label>
                                    <ImageUpload
                                        agentId={user.uid}
                                        propertyId={link.id}
                                        onFileChange={(file) => handleChange(link.id, "file", file)}
                                        onUploadComplete={(imageUrl) => handleChange(link.id, "imageUrl", imageUrl)}
                                        currentImageUrl={link.imageUrl}
                                        id={`upload-${link.id}`}
                                    />
                                </div>
                            </div>
                        )}
                    </motion.div>
                    )
                })}
                </AnimatePresence>
                </div>
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
