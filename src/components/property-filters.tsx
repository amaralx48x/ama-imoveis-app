
'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Home, DollarSign, BedDouble, Car, Filter } from "lucide-react";
import type { Agent } from '@/lib/data';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";

type PropertyFiltersProps = {
    agent?: Agent | null;
    propertyTypes?: string[];
}

export default function PropertyFilters({ agent, propertyTypes = [] }: PropertyFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [operation, setOperation] = useState(searchParams.get('operation') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [bedrooms, setBedrooms] = useState(searchParams.get('bedrooms') || '');
  const [garage, setGarage] = useState(searchParams.get('garage') || '');
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  useEffect(() => {
    // Expand advanced filters if any of them have a value on page load
    if (minPrice || maxPrice || bedrooms || garage) {
      setShowMoreFilters(true);
    }
  }, [minPrice, maxPrice, bedrooms, garage]);


  const handleSearch = () => {
    const query = new URLSearchParams();
    if (operation) query.set('operation', operation);
    if (city && city !== 'outras') query.set('city', city);
    if (type) query.set('type', type);
    if (bedrooms) query.set('bedrooms', bedrooms);
    if (garage) query.set('garage', garage);
    if (keyword) query.set('keyword', keyword);
    if (minPrice) query.set('minPrice', minPrice.replace(/\D/g, ''));
    if (maxPrice) query.set('maxPrice', maxPrice.replace(/\D/g, ''));

    if (agent?.id && agent.id !== 'global') {
        query.set('agentId', agent.id);
    }
    router.push(`/search-results?${query.toString()}`);
  };

  const handlePriceInputChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue) {
        const numberValue = parseInt(rawValue, 10);
        setter(numberValue.toString());
        e.target.value = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0 }).format(numberValue);
    } else {
        setter('');
        e.target.value = '';
    }
  };

  const cities = agent?.cities || [];

  return (
    <Card className="shadow-2xl shadow-primary/10 border-border/10">
        <CardContent className="p-4 space-y-4">
            {/* Linha de Busca Principal */}
            <div className="w-full">
                 <Label htmlFor="keyword-search" className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2"><Search className="w-4 h-4"/> Título, Bairro ou Descrição</Label>
                <Input
                    id="keyword-search"
                    placeholder="Busque por características, código do imóvel ou localização..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
            </div>

            {/* Filtros Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                <Select value={operation} onValueChange={setOperation}>
                    <SelectTrigger>
                        <SelectValue placeholder="Comprar ou Alugar" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Comprar">Comprar</SelectItem>
                        <SelectItem value="Alugar">Alugar</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={city} onValueChange={setCity} disabled={cities.length === 0}>
                    <SelectTrigger>
                         <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4"/>
                            <SelectValue placeholder="Cidade" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        {cities.length > 0 && <SelectItem value="outras">Outras cidades</SelectItem>}
                    </SelectContent>
                </Select>
                
                <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                         <div className="flex items-center gap-2 text-muted-foreground">
                            <Home className="w-4 h-4"/>
                            <SelectValue placeholder="Tipo de Imóvel" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                       {propertyTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
                 
            {/* Filtros Colapsáveis */}
            <Collapsible open={showMoreFilters} onOpenChange={setShowMoreFilters}>
                <CollapsibleContent className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-accordion-down">
                    <div className="space-y-2">
                        <Label htmlFor="min-price">Preço Mínimo</Label>
                        <Input 
                            id="min-price" 
                            type="text" 
                            placeholder="R$ 100.000,00" 
                            onChange={handlePriceInputChange(setMinPrice)}
                            defaultValue={minPrice ? new Intl.NumberFormat('pt-BR').format(parseInt(minPrice)) : ''}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="max-price">Preço Máximo</Label>
                        <Input 
                            id="max-price" 
                            type="text" 
                            placeholder="R$ 500.000,00" 
                            onChange={handlePriceInputChange(setMaxPrice)} 
                            defaultValue={maxPrice ? new Intl.NumberFormat('pt-BR').format(parseInt(maxPrice)) : ''}
                        />
                    </div>
                    <Select value={bedrooms} onValueChange={setBedrooms}>
                        <SelectTrigger>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <BedDouble className="w-4 h-4"/>
                                <SelectValue placeholder="Nº de Quartos" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">1+</SelectItem>
                            <SelectItem value="2">2+</SelectItem>
                            <SelectItem value="3">3+</SelectItem>
                            <SelectItem value="4">4+</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={garage} onValueChange={setGarage}>
                        <SelectTrigger>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Car className="w-4 h-4"/>
                                <SelectValue placeholder="Nº de Vagas" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">1+</SelectItem>
                            <SelectItem value="2">2+</SelectItem>
                            <SelectItem value="3">3+</SelectItem>
                        </SelectContent>
                    </Select>
                </CollapsibleContent>
                <div className="flex justify-between items-center mt-4">
                     <CollapsibleTrigger asChild>
                       <Button variant="ghost">
                            <Filter className="mr-2 h-4 w-4" />
                            {showMoreFilters ? 'Menos Filtros' : 'Mais Filtros'}
                       </Button>
                    </CollapsibleTrigger>
                    <Button onClick={handleSearch} className="h-12 text-base font-bold bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                        <Search className="mr-2 h-5 w-5" />
                        Buscar Imóveis
                    </Button>
                </div>
            </Collapsible>
        </CardContent>
    </Card>
  );
}
