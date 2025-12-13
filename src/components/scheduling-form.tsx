
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Agent } from '@/lib/data';
import { DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Calendar } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getDay, parse } from 'date-fns';


const schedulingFormSchema = z.object({
  name: z.string().min(2, { message: "O nome é obrigatório." }),
  cpf: z.string().min(11, "CPF inválido.").max(14, "CPF inválido."),
  phone: z.string().min(10, "Número de contato inválido."),
  date: z.date({ required_error: "Selecione uma data para a visita." }),
  time: z.string({ required_error: "Selecione um horário." }),
});

interface SchedulingFormProps {
    agent: Agent;
    propertyId: string;
    onFormSubmit?: () => void;
}

const weekDayMap: Record<string, number> = {
    Domingo: 0,
    Segunda: 1,
    Terça: 2,
    Quarta: 3,
    Quinta: 4,
    Sexta: 5,
    Sábado: 6
};

function generateTimeSlots(timeSlots: { start: string; end: string }[], intervalMinutes: number): string[] {
    const allSlots = new Set<string>();
    
    timeSlots.forEach(slot => {
        let currentTime = parse(slot.start, 'HH:mm', new Date());
        const endTime = parse(slot.end, 'HH:mm', new Date());

        while (currentTime < endTime) { // Use < to not include the end time itself
            allSlots.add(currentTime.toTimeString().slice(0, 5));
            currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes);
        }
    });

    return Array.from(allSlots).sort();
}


export function SchedulingForm({ agent, propertyId, onFormSubmit }: SchedulingFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableDays = useMemo(() => {
    if (!agent.availability?.days) return [];
    return Object.entries(agent.availability.days)
      .filter(([_, isAvailable]) => isAvailable)
      .map(([day]) => weekDayMap[day]);
  }, [agent.availability?.days]);
  
  const timeSlots = useMemo(() => {
      const agentTimeSlots = agent.availability?.timeSlots;
      if (!agentTimeSlots || agentTimeSlots.length === 0) {
          return generateTimeSlots([{ start: '09:00', end: '18:00' }], 30);
      }
      return generateTimeSlots(agentTimeSlots, 30); // 30-minute intervals
  }, [agent.availability?.timeSlots]);


  const form = useForm<z.infer<typeof schedulingFormSchema>>({
    resolver: zodResolver(schedulingFormSchema),
    defaultValues: { name: "", cpf: "", phone: "" },
  });

  async function onSubmit(values: z.infer<typeof schedulingFormSchema>) {
    if (!firestore || !agent.id) return;

    setIsSubmitting(true);
    
    const formattedDate = values.date.toLocaleDateString('pt-BR');
    const message = `Solicitação de agendamento de visita para ${formattedDate} às ${values.time}.
    Nome: ${values.name}
    CPF: ${values.cpf}
    Contato: ${values.phone}`;

    try {
      await addDoc(collection(firestore, 'agents', agent.id, 'leads'), {
        name: values.name,
        email: 'scheduling@system.local', // System generated
        phone: values.phone,
        message: message,
        cpf: values.cpf,
        propertyId: propertyId || null,
        visitDate: values.date,
        visitTime: values.time,
        createdAt: serverTimestamp(),
        status: 'unread',
        leadType: 'buyer',
        context: 'buyer:schedule-visit',
      });

      toast({
        title: "Agendamento Solicitado!",
        description: "Sua solicitação de visita foi enviada. Entraremos em contato para confirmar.",
      });
      form.reset();
      onFormSubmit?.();

    } catch (error) {
      console.error("Erro ao solicitar agendamento:", error);
      toast({ title: "Erro ao Enviar", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  return (
    <div>
        <DialogHeader className="text-left p-0 mb-6">
            <DialogTitle className="text-2xl font-bold font-headline">Agendar uma Visita</DialogTitle>
            <DialogDescription>Selecione uma data e horário disponíveis e preencha seus dados para solicitar uma visita.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Data da Visita</FormLabel>
                    <FormControl>
                         <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                                date < new Date() || !availableDays.includes(getDay(date))
                            }
                            initialFocus
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Horário</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione um horário" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {timeSlots.map(time => (
                               <SelectItem key={time} value={time}>{time}</SelectItem>
                           ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
             />
            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input placeholder="Seu nome" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="cpf" render={({ field }) => ( <FormItem><FormLabel>CPF</FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Nº de Contato (WhatsApp)</FormLabel><FormControl><Input placeholder="(11) 99999-9999" {...field} /></FormControl><FormMessage /></FormItem> )} />
            
            <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Solicitando...</> : "Solicitar Agendamento"}
            </Button>
        </form>
        </Form>
    </div>
  );
}
