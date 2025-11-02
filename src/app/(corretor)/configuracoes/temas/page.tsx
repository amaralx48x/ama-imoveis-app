
'use client'

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { toast } from "@/hooks/use-toast";
import type { Theme, SavedTheme } from "@/context/ThemeContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Palette, Loader2, Save, Trash2, CheckCircle } from "lucide-react";
import { defaultTheme, lightTheme, getContrastColor } from "@/context/ThemeContext";
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Componente de paleta de cores
function ColorPicker({ label, value, onChange, description }: { label: string; value: string; onChange: (c: string) => void, description?: string }) {
  return (
    <div className="flex flex-col gap-2">
       <Label>{label}</Label>
      <div className="flex items-center gap-4 p-2 border rounded-md">
        <Input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-12 h-10 p-1" />
        <span className="font-mono text-sm">{value}</span>
      </div>
       {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}


// Preview em tempo real
function Preview({ theme }: { theme: Theme }) {
  const textColor = theme.textDynamic ? getContrastColor(theme.backgroundPrimary) : theme.textPrimary;
  
  return (
    <div className="space-y-4">
        <h3 className="text-xl font-bold font-headline">Preview em Tempo Real</h3>
        <div style={{ backgroundColor: theme.backgroundPrimary, color: textColor }} className="p-4 rounded-lg border-2 border-dashed">
            <header style={{ backgroundColor: theme.headerColor, color: getContrastColor(theme.headerColor) }} className="p-3 rounded-t-md font-bold">
                Cabeçalho do Site
            </header>
            <div className="p-6">
                <h4 className="text-xl font-bold mb-4">Seu conteúdo aqui</h4>
                <div style={{ backgroundColor: theme.backgroundSecondary, color: getContrastColor(theme.backgroundSecondary) }} className="p-4 rounded-md mt-2">
                    <p>Isto é um card ou seção secundária.</p>
                </div>
                 <div className="flex gap-4 mt-4">
                    <button style={{ backgroundColor: theme.buttonPrimary, color: getContrastColor(theme.buttonPrimary) }} className="mt-2 p-2 rounded font-semibold">Botão Primário</button>
                    <button style={{ backgroundColor: theme.buttonSecondary, color: getContrastColor(theme.buttonSecondary) }} className="mt-2 p-2 rounded font-semibold">Botão Secundário</button>
                </div>
            </div>
            <footer style={{ backgroundColor: theme.footerColor, color: getContrastColor(theme.footerColor) }} className="p-3 rounded-b-md text-sm">
                Rodapé do site
            </footer>
        </div>
    </div>
  );
}


export default function ThemeSettingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newThemeName, setNewThemeName] = useState("");
  
  const [localTheme, setLocalTheme] = useState<Theme>(defaultTheme);
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>([]);

  const themeRef = useMemoFirebase(() => (user && firestore ? doc(firestore, "agents", user.uid, "theme", "current") : null), [user, firestore]);
  const agentRef = useMemoFirebase(() => (user && firestore ? doc(firestore, "agents", user.uid) : null), [user, firestore]);

  useEffect(() => {
    if (!themeRef || !agentRef) return;
    setIsLoading(true);

    const fetchInitialData = async () => {
        try {
            const [themeSnap, agentSnap] = await Promise.all([
                getDoc(themeRef),
                getDoc(agentRef)
            ]);

            if (themeSnap.exists()) {
                setLocalTheme(themeSnap.data() as Theme);
            } else {
                setLocalTheme(defaultTheme);
            }

            if (agentSnap.exists()) {
                setSavedThemes(agentSnap.data()?.siteSettings?.savedThemes || []);
            }
        } catch (error) {
            console.error("Error fetching theme data:", error);
            toast({title: "Erro ao carregar dados do tema", variant: "destructive"});
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchInitialData();
  }, [themeRef, agentRef, toast]);


  const handleChange = (field: keyof Theme, value: any) => {
    setLocalTheme(prev => ({ ...prev, [field]: value }));
  };

  const saveCurrentTheme = async () => {
    if (!themeRef) return;
    setIsSaving(true);
    try {
        await setDoc(themeRef, localTheme);
        toast({title: "Tema aplicado com sucesso!"});
    } catch (err) {
        console.error(err);
        toast({title: "Erro ao salvar o tema.", variant: "destructive"});
    } finally {
        setIsSaving(false);
    }
  };

  const handleSaveNamedTheme = async () => {
      if (!newThemeName.trim() || !agentRef) return;
      
      const newSavedTheme: SavedTheme = {
          id: uuidv4(),
          name: newThemeName,
          theme: localTheme,
      };

      const updatedSavedThemes = [...savedThemes, newSavedTheme];
      
      await setDoc(agentRef, {
          siteSettings: { savedThemes: updatedSavedThemes }
      }, { merge: true });

      setSavedThemes(updatedSavedThemes);
      toast({title: `Tema "${newThemeName}" salvo!`});
      setNewThemeName("");
      setIsDialogOpen(false);
  }

  const handleDeleteTheme = async (themeId: string) => {
    if (!agentRef || !window.confirm("Tem certeza que deseja excluir este tema salvo?")) return;
    
    const updatedSavedThemes = savedThemes.filter(t => t.id !== themeId);
    
     await setDoc(agentRef, {
        siteSettings: { savedThemes: updatedSavedThemes }
    }, { merge: true });
    
     setSavedThemes(updatedSavedThemes);
     toast({title: `Tema excluído.`});
  }
  
  if (isLoading) {
      return <div>Carregando tema...</div>
  }

  return (
    <Card>
        <CardHeader>
             <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                <Palette /> Aparência e Temas
            </CardTitle>
            <CardDescription>
                Personalize as cores do seu site público. Selecione um tema pré-definido ou crie o seu. As alterações são refletidas em tempo real no preview abaixo.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div>
                <h3 className="text-xl font-bold font-headline mb-4">Temas Pré-definidos</h3>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setLocalTheme(defaultTheme)}>Padrão (Escuro)</Button>
                    <Button variant="outline" onClick={() => setLocalTheme(lightTheme)}>Claro</Button>
                </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <ColorPicker label="Cor do Cabeçalho" value={localTheme.headerColor} onChange={(c) => handleChange("headerColor", c)} />
                <ColorPicker label="Cor do Rodapé" value={localTheme.footerColor} onChange={(c) => handleChange("footerColor", c)} />
                <ColorPicker label="Cor de Fundo (Primária)" value={localTheme.backgroundPrimary} onChange={(c) => handleChange("backgroundPrimary", c)} description="Cor principal do fundo do site." />
                <ColorPicker label="Cor de Fundo (Secundária)" value={localTheme.backgroundSecondary} onChange={(c) => handleChange("backgroundSecondary", c)} description="Usada em cards e seções internas."/>
                <ColorPicker label="Cor do Botão (Primário)" value={localTheme.buttonPrimary} onChange={(c) => handleChange("buttonPrimary", c)} />
                <ColorPicker label="Cor do Botão (Secundário)" value={localTheme.buttonSecondary} onChange={(c) => handleChange("buttonSecondary", c)} />
            </div>

            <Separator />
            
            <div className="space-y-4">
                 <h3 className="text-xl font-bold font-headline">Cores de Texto</h3>
                 <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="text-dynamic" className="text-base font-medium">Texto com Contraste Dinâmico</Label>
                        <p id="text-dynamic-description" className="text-sm text-muted-foreground">
                            Ajusta automaticamente a cor do texto (preto ou branco) para garantir a legibilidade sobre a cor de fundo.
                        </p>
                    </div>
                    <Switch
                        id="text-dynamic"
                        checked={localTheme.textDynamic}
                        onCheckedChange={(checked) => handleChange("textDynamic", checked)}
                        aria-describedby="text-dynamic-description"
                    />
                </div>

                {!localTheme.textDynamic && (
                    <ColorPicker label="Cor do Texto (Primária)" value={localTheme.textPrimary} onChange={(c) => handleChange("textPrimary", c)} description="Defina manualmente a cor principal do texto. Use com cuidado."/>
                )}
            </div>
            
            <Separator />

            <Preview theme={localTheme} />

            <div className="flex justify-end gap-2 pt-4">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                         <Button variant="outline"><Save className="mr-2 h-4 w-4"/>Salvar Tema Atual</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Salvar Tema Personalizado</DialogTitle>
                            <DialogDescription>Dê um nome para sua configuração de tema atual para usá-la mais tarde.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-2">
                             <Label htmlFor="theme-name">Nome do Tema</Label>
                            <Input id="theme-name" value={newThemeName} onChange={(e) => setNewThemeName(e.target.value)} placeholder="Ex: Meu Tema Azul"/>
                        </div>
                        <Button onClick={handleSaveNamedTheme} disabled={!newThemeName.trim()}>Salvar</Button>
                    </DialogContent>
                </Dialog>
               
                <Button onClick={saveCurrentTheme} disabled={isSaving} className="bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                    {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Aplicando...</> : "Aplicar Tema ao Site"}
                </Button>
            </div>
            
            {savedThemes.length > 0 && (
                <>
                <Separator />
                <div>
                     <h3 className="text-xl font-bold font-headline mb-4">Meus Temas Salvos</h3>
                     <div className="space-y-2">
                        {savedThemes.map((saved) => (
                            <div key={saved.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                                <span className="font-medium">{saved.name}</span>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => setLocalTheme(saved.theme)}><CheckCircle className="mr-2 h-4 w-4 text-green-500"/> Aplicar</Button>
                                    <Button size="icon" variant="destructive" className="h-9 w-9" onClick={() => handleDeleteTheme(saved.id)}><Trash2 className="h-4 w-4"/></Button>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
                </>
            )}

        </CardContent>
    </Card>
  );
}
