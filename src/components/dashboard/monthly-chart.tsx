'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Property } from '@/lib/data';
import { useMemo } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthlyPerformanceChartProps {
  properties: Property[];
  isLoading: boolean;
}

type ChartData = {
  date: string;
  Vendas: number;
  Aluguéis: number;
  Comissão: number;
};

export function MonthlyPerformanceChart({ properties, isLoading }: MonthlyPerformanceChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const daysInMonth = eachDayOfInterval({ start, end });

    const data: ChartData[] = daysInMonth.map(day => ({
      date: format(day, 'dd/MM'),
      Vendas: 0,
      Aluguéis: 0,
      Comissão: 0,
    }));

    properties.forEach(p => {
      if ((p.status === 'vendido' || p.status === 'alugado') && p.soldAt) {
        const transactionDate = p.soldAt.toDate();
        if (transactionDate >= start && transactionDate <= end) {
          const dayIndex = data.findIndex(d => d.date === format(transactionDate, 'dd/MM'));
          if (dayIndex !== -1) {
            if (p.status === 'vendido') {
              data[dayIndex].Vendas += 1;
            } else {
              data[dayIndex].Aluguéis += 1;
            }
            data[dayIndex].Comissão += p.commissionValue || 0;
          }
        }
      }
    });

    return data;
  }, [properties]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col space-y-1">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Data
              </span>
              <span className="font-bold text-muted-foreground">{label}</span>
            </div>
             <div className="flex flex-col space-y-1">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Comissão
              </span>
              <span className="font-bold">
                 {payload.find((p: any) => p.dataKey === 'Comissão')?.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
             <div className="flex flex-col space-y-1">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Vendas
              </span>
              <span className="font-bold">
                {payload.find((p: any) => p.dataKey === 'Vendas')?.value}
              </span>
            </div>
             <div className="flex flex-col space-y-1">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Aluguéis
              </span>
              <span className="font-bold">
                {payload.find((p: any) => p.dataKey === 'Aluguéis')?.value}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Desempenho no Mês</CardTitle>
        <CardDescription>Resumo de negócios fechados e comissões no mês atual.</CardDescription>
      </CardHeader>
      <CardContent className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {isLoading ? (
             <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Carregando dados do gráfico...
            </div>
          ) : (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$${value/1000}k`}
              yAxisId="left"
            />
             <YAxis
              orientation="right"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
              yAxisId="right"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{fontSize: "14px"}}/>
            <Bar dataKey="Comissão" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} yAxisId="left" />
            <Bar dataKey="Vendas" fill="#82ca9d" radius={[4, 4, 0, 0]} yAxisId="right"/>
            <Bar dataKey="Aluguéis" fill="#8884d8" radius={[4, 4, 0, 0]} yAxisId="right"/>
          </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
