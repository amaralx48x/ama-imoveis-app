'use client';
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { Property } from "@/lib/data";

interface PropertyFiltersProps {
  onFilter: (filters: any) => void;
  properties: Property[];
}

export default function PropertyFilters({ onFilter, properties }: PropertyFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    keyword: "",
    type: "",
    operation: "",
    city: "",
    neighborhood: "",
    minPrice: "",
    maxPrice: "",
    bedrooms: "",
    garage: "",
  });

  const uniqueValues = (key: keyof Property) => {
    if (!properties) return [];
    const values = properties
      .map(p => p[key])
      .filter((value, index, self) => value && self.indexOf(value) === index);
    // @ts-ignore
    return values.sort((a, b) => a.localeCompare(b));
  };

  const cities = uniqueValues('city');
  const types = uniqueValues('type');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    // Convert garage to boolean if it's a string 'true'/'false'
    const finalFilters = {
        ...filters,
        garage: filters.garage === 'true' ? true : filters.garage === 'false' ? false : '',
    };
    onFilter(finalFilters);
  }

  return (
    <div className="bg-card rounded-xl shadow-lg p-6 space-y-4 border border-border/50">
      {/* Barra principal */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
            type="text"
            name="keyword"
            placeholder="Busque por cidade, bairro ou palavra-chave..."
            value={filters.keyword}
            onChange={handleChange}
            className="flex-1 p-2 pl-10 border rounded-md h-12"
            />
        </div>
        <div className="flex w-full md:w-auto gap-3">
            <Button onClick={handleApply} className="w-full md:w-auto h-12 bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                <Search className="mr-2" />
                Buscar
            </Button>
            <Button
                onClick={() => setShowAdvanced(!showAdvanced)}
                variant="outline"
                className="h-12 w-full md:w-auto"
            >
                <SlidersHorizontal className="mr-2"/>
                Filtros
            </Button>
        </div>
      </div>

      {/* Filtros avançados */}
      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 border-t">
          
          <Select name="operation" onValueChange={handleSelectChange('operation')}>
             <SelectTrigger><SelectValue placeholder="Operação" /></SelectTrigger>
             <SelectContent>
                <SelectItem value="Venda">Venda</SelectItem>
                <SelectItem value="Aluguel">Aluguel</SelectItem>
             </SelectContent>
          </Select>

          <Select name="city" onValueChange={handleSelectChange('city')}>
             <SelectTrigger><SelectValue placeholder="Cidade" /></SelectTrigger>
             <SelectContent>
                {cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
             </SelectContent>
          </Select>

          <Select name="type" onValueChange={handleSelectChange('type')}>
             <SelectTrigger><SelectValue placeholder="Tipo de Imóvel" /></SelectTrigger>
             <SelectContent>
                {types.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
             </SelectContent>
          </Select>
          
          <Input
            type="number"
            name="minPrice"
            placeholder="Preço mínimo"
            value={filters.minPrice}
            onChange={handleChange}
          />
          <Input
            type="number"
            name="maxPrice"
            placeholder="Preço máximo"
            value={filters.maxPrice}
            onChange={handleChange}
          />

          <Input
            type="number"
            name="bedrooms"
            placeholder="Nº de Quartos"
            value={filters.bedrooms}
            onChange={handleChange}
          />

          <Select name="garage" onValueChange={handleSelectChange('garage')}>
             <SelectTrigger><SelectValue placeholder="Com Garagem?" /></SelectTrigger>
             <SelectContent>
                <SelectItem value="true">Sim</SelectItem>
                <SelectItem value="false">Não</SelectItem>
             </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
