
'use client';
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Label } from "./ui/label";

interface PropertyFiltersProps {
    onFilter: (filters: any) => void;
    cities: string[];
    propertyTypes: string[];
}

export default function PropertyFilters({ onFilter, cities, propertyTypes }: PropertyFiltersProps) {
  const [filters, setFilters] = useState({
    operation: "",
    city: "",
    type: "",
    minPrice: "",
    maxPrice: "",
    bedrooms: "",
    garage: "",
    keyword: ""
  });
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSearch = () => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        query.append(key, value);
      }
    });
    router.push(`/search?${query.toString()}`);
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Operation */}
        <Select name="operation" onValueChange={handleSelectChange('operation')}>
          <SelectTrigger><SelectValue placeholder="Operação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Comprar">Comprar</SelectItem>
            <SelectItem value="Alugar">Alugar</SelectItem>
          </SelectContent>
        </Select>

        {/* City */}
        <Select name="city" onValueChange={handleSelectChange('city')} disabled={cities.length === 0}>
          <SelectTrigger><SelectValue placeholder="Cidade" /></SelectTrigger>
          <SelectContent>
            {cities.length > 0 ? 
                cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>) :
                <SelectItem value="none" disabled>Nenhuma cidade de atuação</SelectItem>
            }
          </SelectContent>
        </Select>

        {/* Property Type */}
        <Select name="type" onValueChange={handleSelectChange('type')}>
          <SelectTrigger><SelectValue placeholder="Tipo de Imóvel" /></SelectTrigger>
          <SelectContent>
            {propertyTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Advanced Filters & Search Button */}
        <div className="flex gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-10">
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        Mais Filtros
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Filtros Avançados</h4>
                            <p className="text-sm text-muted-foreground">
                                Refine sua busca com mais detalhes.
                            </p>
                        </div>
                        <div className="grid gap-2">
                             <div className="grid grid-cols-2 items-center gap-4">
                                <Label htmlFor="keyword">Busca Livre</Label>
                                <Input id="keyword" name="keyword" placeholder="Ex: piscina" onChange={handleChange} value={filters.keyword} />
                            </div>
                            <div className="grid grid-cols-2 items-center gap-4">
                                <Label htmlFor="minPrice">Preço Mín.</Label>
                                <Input id="minPrice" name="minPrice" type="number" placeholder="R$ 100.000" onChange={handleChange} value={filters.minPrice} />
                            </div>
                            <div className="grid grid-cols-2 items-center gap-4">
                                <Label htmlFor="maxPrice">Preço Máx.</Label>
                                <Input id="maxPrice" name="maxPrice" type="number" placeholder="R$ 500.000" onChange={handleChange} value={filters.maxPrice} />
                            </div>
                             <div className="grid grid-cols-2 items-center gap-4">
                                <Label htmlFor="bedrooms">Quartos</Label>
                                <Input id="bedrooms" name="bedrooms" type="number" placeholder="3" onChange={handleChange} value={filters.bedrooms} />
                            </div>
                             <div className="grid grid-cols-2 items-center gap-4">
                                <Label htmlFor="garage">Vagas Garagem</Label>
                                <Input id="garage" name="garage" type="number" placeholder="2" onChange={handleChange} value={filters.garage} />
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
            <Button onClick={handleSearch} className="w-full h-10 bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                <Search className="mr-2 h-4 w-4" />
                Buscar
            </Button>
        </div>
      </div>
    </div>
  );
}
