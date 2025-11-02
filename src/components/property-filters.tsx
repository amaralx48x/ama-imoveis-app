
'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Home, DollarSign, BedDouble, Car } from "lucide-react";
import type { Agent } from '@/lib/data';

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

  const handleSearch = () => {
    const query = new URLSearchParams();
    if (operation) query.set('operation', operation);
    if (city) query.set('city', city);
    if (type) query.set('type', type);
    if (bedrooms) query.set('bedrooms', bedrooms);
    if (garage) query.set('garage', garage);
    if (keyword) query.set('keyword', keyword);
    if (agent?.id && agent.id !== 'global') {
        query.set('agentId', agent.id);
    }
    router.push(`/search-results?${query.toString()}`);
  };

  const cities = agent?.cities || [];

  return (
    <Card className="shadow-2xl shadow-primary/10 border-border/10">
        <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-3 lg:col-span-4">
                     <label htmlFor="keyword-search" className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2"><Search className="w-4 h-4"/> Termo de busca</label>
                    <Input
                        id="keyword-search"
                        placeholder="Busque por título, bairro ou características..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-3 lg:col-span-4">
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
                     <Select value={bedrooms} onValueChange={setBedrooms}>
                        <SelectTrigger>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <BedDouble className="w-4 h-4"/>
                                <SelectValue placeholder="Quartos" />
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
                                <SelectValue placeholder="Vagas" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">1+</SelectItem>
                            <SelectItem value="2">2+</SelectItem>
                            <SelectItem value="3">3+</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <Button onClick={handleSearch} className="w-full h-12 text-base font-bold bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity col-span-1 md:col-span-3 lg:col-span-4">
                    <Search className="mr-2 h-5 w-5" />
                    Buscar Imóveis
                </Button>
            </div>
        </CardContent>
    </Card>
  );
}
