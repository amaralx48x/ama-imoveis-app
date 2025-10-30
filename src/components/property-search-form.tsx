"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { getPropertyCities, getPropertyTypes } from '@/lib/data';
import { useState } from 'react';

export function PropertySearchForm() {
  const router = useRouter();

  const cities = getPropertyCities();
  const types = getPropertyTypes();

  const [operation, setOperation] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('');


  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (operation) params.set('operation', operation);
    if (city) params.set('city', city);
    if (type) params.set('type', type);
    
    router.push(`/search?${params.toString()}`);
  };

  return (
    <Card className="bg-background/80 backdrop-blur-sm border-white/20 shadow-lg">
      <CardContent className="p-4">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <Select name="operation" onValueChange={setOperation} defaultValue={operation}>
            <SelectTrigger className="w-full text-base h-12">
              <SelectValue placeholder="Operação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Venda">Venda</SelectItem>
              <SelectItem value="Aluguel">Aluguel</SelectItem>
            </SelectContent>
          </Select>

          <Select name="city" onValueChange={setCity} defaultValue={city}>
            <SelectTrigger className="w-full text-base h-12">
              <SelectValue placeholder="Cidade" />
            </SelectTrigger>
            <SelectContent>
              {cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select name="type" onValueChange={setType} defaultValue={type}>
            <SelectTrigger className="w-full text-base h-12">
              <SelectValue placeholder="Tipo de Imóvel" />
            </SelectTrigger>
            <SelectContent>
              {types.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
            </SelectContent>
          </Select>

          <Button type="submit" size="lg" className="w-full h-12 bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
            <Search className="mr-2 h-5 w-5" />
            Buscar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
