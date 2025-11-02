'use client'

import { useState, useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { toast } from "@/hooks/use-toast";
import type { Theme } from "@/context/ThemeContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Palette, Loader2 } from "lucide-react";
import { defaultTheme, getContrastColor } from "@/context/ThemeContext";

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
  
  const themeRef = useMemoFirebase(() => (user && firestore ? doc(firestore, "agents", user.uid, "themes", "current") : null), [user, firestore]);
  const {data: savedTheme, isLoading} = useDoc<Theme>(themeRef);

  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, [savedTheme]);

  const handleChange = (field: keyof Theme, value: any) => {
    setTheme(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setTheme(defaultTheme);
     toast.info("Tema redefinido para o padrão. Salve para aplicar.");
  }

  const saveTheme = async () => {
    if (!user || !themeRef) return;
    setIsSaving(true);
    try {
        await setDoc(themeRef, theme);
        toast.success("Tema salvo com sucesso!");
    } catch (err) {
        console.error(err);
        toast.error("Erro ao salvar o tema.");
    } finally {
        setIsSaving(false);
    }
  };
  
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
                Personalize as cores do seu site público para combinar com sua marca. As alterações são refletidas em tempo real no preview abaixo.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <ColorPicker label="Cor do Cabeçalho" value={theme.headerColor} onChange={(c) => handleChange("headerColor", c)} />
                <ColorPicker label="Cor do Rodapé" value={theme.footerColor} onChange={(c) => handleChange("footerColor", c)} />
                <ColorPicker label="Cor de Fundo (Primária)" value={theme.backgroundPrimary} onChange={(c) => handleChange("backgroundPrimary", c)} description="Cor principal do fundo do site." />
                <ColorPicker label="Cor de Fundo (Secundária)" value={theme.backgroundSecondary} onChange={(c) => handleChange("backgroundSecondary", c)} description="Usada em cards e seções internas."/>
                <ColorPicker label="Cor do Botão (Primário)" value={theme.buttonPrimary} onChange={(c) => handleChange("buttonPrimary", c)} />
                <ColorPicker label="Cor do Botão (Secundário)" value={theme.buttonSecondary} onChange={(c) => handleChange("buttonSecondary", c)} />
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
                        checked={theme.textDynamic}
                        onCheckedChange={(checked) => handleChange("textDynamic", checked)}
                        aria-describedby="text-dynamic-description"
                    />
                </div>

                {!theme.textDynamic && (
                    <ColorPicker label="Cor do Texto (Primária)" value={theme.textPrimary} onChange={(c) => handleChange("textPrimary", c)} description="Defina manualmente a cor principal do texto. Use com cuidado."/>
                )}
            </div>
            
            <Separator />

            <Preview theme={theme} />

            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleReset}>Redefinir Padrão</Button>
                <Button onClick={saveTheme} disabled={isSaving} className="bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                    {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Salvando...</> : "Salvar Tema"}
                </Button>
            </div>
        </CardContent>
    </Card>
  );
}
