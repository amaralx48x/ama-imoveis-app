'use server';
/**
 * @fileOverview Flow to generate a real estate property description using AI.
 *
 * - generatePropertyDescription - A function that generates a persuasive property description.
 * - GeneratePropertyDescriptionInput - The input type for the function.
 * - GeneratePropertyDescriptionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Property } from '@/lib/data';

const GeneratePropertyDescriptionInputSchema = z.object({
  type: z.string().describe("Tipo do imóvel (ex: Casa, Apartamento, Chácara)."),
  operation: z.string().describe("Tipo de operação (Venda ou Aluguel)."),
  city: z.string().describe("Cidade onde o imóvel está localizado."),
  neighborhood: z.string().describe("Bairro do imóvel."),
  bedrooms: z.number().int().optional().describe("Número de quartos."),
  bathrooms: z.number().int().optional().describe("Número de banheiros."),
  garage: z.number().int().optional().describe("Número de vagas na garagem."),
  builtArea: z.number().optional().describe("Área construída em metros quadrados."),
});
export type GeneratePropertyDescriptionInput = z.infer<typeof GeneratePropertyDescriptionInputSchema>;

const GeneratePropertyDescriptionOutputSchema = z.object({
  description: z.string().describe("A descrição completa e persuasiva do imóvel gerada pela IA."),
});
export type GeneratePropertyDescriptionOutput = z.infer<typeof GeneratePropertyDescriptionOutputSchema>;

export async function generatePropertyDescription(input: GeneratePropertyDescriptionInput): Promise<GeneratePropertyDescriptionOutput> {
  return generatePropertyDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePropertyDescriptionPrompt',
  input: { schema: GeneratePropertyDescriptionInputSchema },
  output: { schema: GeneratePropertyDescriptionOutputSchema },
  prompt: `
    Você é um corretor de imóveis especialista em copywriting e marketing imobiliário. Sua tarefa é criar uma descrição de anúncio de imóvel que seja completa, atraente e persuasiva, destacando os pontos fortes com base nas informações fornecidas.

    **Instruções:**
    1.  Comece com uma frase de impacto que chame a atenção.
    2.  Descreva o imóvel de forma fluida e convidativa, detalhando os cômodos e características principais (quartos, banheiros, sala, cozinha, garagem).
    3.  Enfatize os benefícios de morar no bairro e na cidade mencionada, como conveniência, segurança, lazer ou qualidade de vida.
    4.  Use parágrafos curtos para facilitar a leitura.
    5.  Finalize com uma chamada para ação (call to action) clara e convidativa, incentivando o contato e o agendamento de uma visita.
    6.  A descrição deve ter entre 4 e 6 parágrafos.
    7.  Seja criativo e use adjetivos que valorizem o imóvel.

    **Informações do Imóvel:**
    - Tipo de Operação: {{{operation}}}
    - Tipo de Imóvel: {{{type}}}
    - Cidade: {{{city}}}
    - Bairro: {{{neighborhood}}}
    - Quartos: {{{bedrooms}}}
    - Banheiros: {{{bathrooms}}}
    - Vagas na Garagem: {{{garage}}}
    - Área Construída: {{{builtArea}}} m²

    Gere apenas o texto da descrição para o campo 'description' do JSON de saída.
  `,
});

const generatePropertyDescriptionFlow = ai.defineFlow(
  {
    name: 'generatePropertyDescriptionFlow',
    inputSchema: GeneratePropertyDescriptionInputSchema,
    outputSchema: GeneratePropertyDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
