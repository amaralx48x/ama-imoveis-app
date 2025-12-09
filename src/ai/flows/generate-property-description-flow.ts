
'use server';
/**
 * @fileOverview Flow to generate a real estate property description using AI.
 *
 * - generatePropertyDescription - A function that generates a persuasive property description.
 * - GeneratePropertyDescriptionInput - The input type for the function.
 * - GeneratePropertyDescriptionOutput - The return type for the function.
 */

import { z } from 'zod';

const GeneratePropertyDescriptionInputSchema = z.object({
  style: z.enum(['short', 'detailed']).describe("O estilo da descrição a ser gerada."),
  type: z.string().describe("Tipo do imóvel (ex: Casa, Apartamento, Chácara)."),
  operation: z.string().describe("Tipo de operação (Venda ou Aluguel)."),
  city: z.string().describe("Cidade onde o imóvel está localizado."),
  neighborhood: z.string().describe("Bairro do imóvel."),
  bedrooms: z.number().int().optional().describe("Número de quartos."),
  bathrooms: z.number().int().optional().describe("Número de banheiros."),
  garage: z.number().int().optional().describe("Número de vagas na garagem."),
  builtArea: z.number().optional().describe("Área construída em metros quadrados."),
  price: z.number().optional().describe("Preço do imóvel para a operação."),
});
export type GeneratePropertyDescriptionInput = z.infer<typeof GeneratePropertyDescriptionInputSchema>;

const GeneratePropertyDescriptionOutputSchema = z.object({
  description: z.string().describe("A descrição completa e persuasiva do imóvel gerada pela IA."),
});
export type GeneratePropertyDescriptionOutput = z.infer<typeof GeneratePropertyDescriptionOutputSchema>;


export async function generatePropertyDescription(input: GeneratePropertyDescriptionInput): Promise<GeneratePropertyDescriptionOutput> {
  // Funcionalidade de IA desativada temporariamente.
  return Promise.reject(new Error("A funcionalidade de geração de descrição por IA está em construção."));
}
