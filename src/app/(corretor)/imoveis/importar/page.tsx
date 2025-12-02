
'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { useFirestore, useUser } from '@/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle, FileUp, ListChecks, Send, XCircle, Gem, Loader2, Link as LinkIcon, Rss } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { Property } from '@/lib/data';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { usePlan } from '@/context/PlanContext';

type CSVRow = Record<string, any>;
type StagedProperty = {
    data: Partial<Property>;
    status: 'valid' | 'invalid';
    errors: string[];
};

const requiredFields = ['title', 'description', 'price', 'bedrooms', 'bathrooms', 'garage', 'rooms', 'builtArea', 'totalArea', 'city', 'neighborhood', 'type', 'operation'];
const propertyTypes = ["Apartamento", "Casa", "Chácara", "Galpão", "Sala", "Kitnet", "Terreno", "Lote", "Alto Padrão"];
const operationTypes = ["Venda", "Aluguel"]; 

export default function ImportImoveisPage() {
  const [stagedProperties, setStagedProperties] = useState<StagedProperty[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [xmlUrl, setXmlUrl] = useState('');
  const [isImportingFromXml, setIsImportingFromXml] = useState(false);
  
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { limits, isLoading: isPlanLoading } = usePlan();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStagedProperties([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim(),
      complete: (results) => {
        const validatedData = results.data.map((row: CSVRow) => {
            const errors: string[] = [];
            
            for (const field of requiredFields) {
                if (!row[field] || String(row[field]).trim() === '') {
                    errors.push(`Campo obrigatório ausente: ${field}`);
                }
            }

            const numericFields = ['price', 'bedrooms', 'bathrooms', 'garage', 'rooms', 'builtArea', 'totalArea'];
            for (const field of numericFields) {
                if (row[field] && isNaN(Number(row[field]))) {
                     errors.push(`Campo '${field}' deve ser um número.`);
                }
            }
            
            if (row.type && !propertyTypes.includes(row.type)) {
                errors.push(`Tipo de imóvel inválido: '${row.type}'.`);
            }
            if (row.operation && !operationTypes.includes(row.operation)) {
                errors.push(`Operação inválida: '${row.operation}'.`);
            }

            const propertyData: Partial<Property> = {
                title: row.title,
                description: row.description,
                price: Number(row.price),
                bedrooms: Number(row.bedrooms),
                bathrooms: Number(row.bathrooms),
                garage: Number(row.garage),
                rooms: Number(row.rooms),
                builtArea: Number(row.builtArea),
                totalArea: Number(row.totalArea),
                city: row.city,
                neighborhood: row.neighborhood,
                type: row.type as Property['type'],
                operation: row.operation as Property['operation'],
                imageUrls: row.imageUrls ? row.imageUrls.split(',').map((url: string) => url.trim()) : [],
            };

            return {
                data: propertyData,
                status: errors.length > 0 ? 'invalid' : 'valid',
                errors: errors
            } as StagedProperty;
        });
        setStagedProperties(validatedData);
      },
       error: (error) => {
        toast({
            title: "Erro ao ler o arquivo CSV",
            description: error.message,
            variant: "destructive"
        })
      }
    });
  };

  const handleUploadToFirestore = async () => {
    if (!user || !firestore) {
      toast({ title: "Erro de autenticação", description: "Usuário não encontrado.", variant: "destructive" });
      return;
    }
    
    const validProperties = stagedProperties.filter(p => p.status === 'valid');
    if (validProperties.length === 0) {
        toast({ title: "Nenhum imóvel válido para importar", description: "Corrija os erros no seu arquivo CSV e tente novamente.", variant: "destructive" });
        return;
    }

    setIsUploading(true);
    const batch = writeBatch(firestore);
    
    validProperties.forEach(p => {
      const propertyId = uuidv4();
      const docRef = doc(firestore, `agents/${user.uid}/properties`, propertyId);
      batch.set(docRef, {
        ...p.data,
        id: propertyId,
        agentId: user.uid,
        createdAt: new Date().toISOString(),
        status: 'ativo',
        sectionIds: ['featured']
      });
    });

    try {
        await batch.commit();
        toast({
            title: "Importação Concluída!",
            description: `${validProperties.length} imóveis foram importados com sucesso.`
        });
        setStagedProperties([]);
        setFileName('');
    } catch (error: any) {
        toast({
            title: "Erro na Importação",
            description: "Não foi possível salvar os imóveis no banco de dados. " + error.message,
            variant: "destructive"
        });
    } finally {
        setIsUploading(false);
    }
  };

  const handleImportFromXml = async () => {
    if (!xmlUrl.trim()) {
        return toast({ title: "URL do XML é obrigatória", variant: "destructive" });
    }
    if (!user) {
        return toast({ title: "Usuário não autenticado", variant: "destructive" });
    }

    setIsImportingFromXml(true);
    try {
        const response = await fetch('/api/import-xml', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId: user.uid, xmlUrl }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Erro desconhecido ao importar XML.');
        }

        toast({
            title: "Importação XML Iniciada!",
            description: `${result.importedCount} imóveis foram importados com sucesso.`,
        });
        setXmlUrl('');

    } catch (error: any) {
        console.error("Erro ao importar do XML:", error);
        toast({ title: "Erro na Importação XML", description: error.message, variant: "destructive" });
    } finally {
        setIsImportingFromXml(false);
    }
};
  
  const validCount = stagedProperties.filter(p => p.status === 'valid').length;
  const invalidCount = stagedProperties.filter(p => p.status === 'invalid').length;

   if (isPlanLoading) {
      return (
         <div className="space-y-4 max-w-2xl mx-auto flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Verificando permissões do plano...</p>
        </div>
      )
  }

  if (!limits.canImportCSV) {
     return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <Button variant="outline" asChild>
            <Link href="/imoveis">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Meus Imóveis
            </Link>
        </Button>
        <Alert variant="destructive" className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 text-foreground">
            <Gem className="h-4 w-4 text-primary" />
            <AlertTitle className="text-xl text-primary font-bold">Recurso Exclusivo do Plano AMA ULTRA</AlertTitle>
            <AlertDescription>
                A importação de imóveis por planilha (CSV) é uma ferramenta poderosa para economizar seu tempo. Faça o upgrade para o plano AMA ULTRA para desbloquear este e outros benefícios.
                <Button asChild variant="link" className="p-0 h-auto ml-1 text-primary">
                    <Link href="/meu-plano">Conhecer Planos e Fazer Upgrade</Link>
                </Button>
            </AlertDescription>
        </Alert>
      </div>
    );
  }


  return (
    <div className="space-y-6">
        <Button variant="outline" asChild>
            <Link href="/imoveis">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Meus Imóveis
            </Link>
        </Button>
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2"><FileUp/> Importar Imóveis</CardTitle>
                <CardDescription>
                Adicione múltiplos imóveis de uma vez, seja através de um arquivo CSV ou de um feed XML de outro portal.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* XML Import Section */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2"><Rss /> Importar via Feed XML</h3>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                            placeholder="Cole a URL do feed XML aqui..."
                            value={xmlUrl}
                            onChange={(e) => setXmlUrl(e.target.value)}
                            disabled={isImportingFromXml}
                        />
                        <Button onClick={handleImportFromXml} disabled={isImportingFromXml || !xmlUrl.trim()}>
                            {isImportingFromXml ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importando...</> : <><LinkIcon className="mr-2 h-4 w-4"/> Importar do XML</>}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Cole o link de um feed XML no formato ZAP/OLX para importar os imóveis para sua conta.</p>
                </div>

                <Separator />

                {/* CSV Import Section */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Importar via Arquivo CSV</h3>
                    <div className="p-4 border-2 border-dashed rounded-lg text-center">
                        <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                            <FileUp className="w-8 h-8"/>
                            <span className="font-medium">{fileName || "Clique aqui para selecionar um arquivo .csv"}</span>
                        </label>
                        <Input id="csv-upload" type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    </div>
                     <CardDescription>
                        <a href="/imoveis-exemplo.csv" download className="text-primary underline font-medium">Baixar arquivo de exemplo (.csv)</a> para garantir a formatação correta.
                    </CardDescription>
                </div>

                {stagedProperties.length > 0 && (
                <div className="space-y-6">
                    <Alert>
                        <ListChecks className="h-4 w-4" />
                        <AlertTitle>Prévia da Importação</AlertTitle>
                        <AlertDescription className="flex gap-4">
                        <span><b className="text-green-500">{validCount}</b> imóveis válidos.</span>
                        <span><b className="text-destructive">{invalidCount}</b> imóveis com erros.</span>
                        </AlertDescription>
                    </Alert>
                    
                    <div className="max-h-[400px] overflow-auto border rounded-lg">
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur-sm">
                                <TableRow>
                                    <TableHead className="w-[50px]">Status</TableHead>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Cidade</TableHead>
                                    <TableHead>Preço</TableHead>
                                    <TableHead>Erros</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stagedProperties.slice(0, 20).map((p, index) => (
                                    <TableRow key={index} className={p.status === 'invalid' ? 'bg-destructive/10' : ''}>
                                        <TableCell>
                                            {p.status === 'valid' 
                                                ? <CheckCircle className="h-5 w-5 text-green-500" /> 
                                                : <XCircle className="h-5 w-5 text-destructive" />}
                                        </TableCell>
                                        <TableCell className="font-medium">{p.data.title || 'N/A'}</TableCell>
                                        <TableCell>{p.data.city || 'N/A'}</TableCell>
                                        <TableCell>{p.data.price ? Number(p.data.price).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) : 'N/A'}</TableCell>
                                        <TableCell className="text-xs text-destructive">{p.errors.join(', ')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {stagedProperties.length > 20 && <p className="p-4 text-center text-sm text-muted-foreground">Mostrando os primeiros 20 registros...</p>}
                    </div>
                    
                    <Separator />

                    <div className="flex justify-end">
                        <Button
                            onClick={handleUploadToFirestore}
                            disabled={isUploading || validCount === 0}
                            size="lg"
                            className="bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity"
                        >
                            <Send className="mr-2 h-4 w-4" />
                            {isUploading ? `Importando ${validCount} imóveis...` : `Importar ${validCount} imóveis válidos`}
                        </Button>
                    </div>
                </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
