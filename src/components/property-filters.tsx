
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function PropertyFilter({ isSearchPage = false }: { isSearchPage?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    city: searchParams.get("city") || "",
    type: searchParams.get("type") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
  });

  const handleChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) query.append(k, v);
    });
    router.push(`/search-results?${query.toString()}`);
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Input
        placeholder="Cidade"
        value={filters.city}
        onChange={(e) => handleChange("city", e.target.value)}
      />
      <Select value={filters.type} onValueChange={(v) => handleChange("type", v)}>
        <SelectTrigger>
          <SelectValue placeholder="Tipo de imóvel" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="casa">Casa</SelectItem>
          <SelectItem value="apartamento">Apartamento</SelectItem>
          <SelectItem value="terreno">Terreno</SelectItem>
          <SelectItem value="comercial">Comercial</SelectItem>
        </SelectContent>
      </Select>

      <Input
        placeholder="Preço mínimo"
        type="number"
        value={filters.minPrice}
        onChange={(e) => handleChange("minPrice", e.target.value)}
      />
      <Input
        placeholder="Preço máximo"
        type="number"
        value={filters.maxPrice}
        onChange={(e) => handleChange("maxPrice", e.target.value)}
      />

      <Button onClick={handleSearch} className="w-full bg-amber-500 hover:bg-amber-600">
        {isSearchPage ? "Atualizar busca" : "Buscar imóveis"}
      </Button>
    </div>
  );
}
