
'use server';
/**
 * @fileOverview Flow to generate a social media post for a property.
 *
 * - generateSocialCardPost - A function that takes a property description and generates a catchy social media caption.
 * - GenerateSocialCardPostInput - The input type for the function.
 * - GenerateSocialCardPostOutput - The return type for the function.
 */

import { z } from 'zod';

const GenerateSocialCardPostInputSchema = z.object({
  description: z.string().describe('The full description of the property.'),
  price: z.string().describe('The formatted price of the property (e.g., "R$ 500.000,00").'),
  operation: z.enum(['Venda', 'Aluguel']).describe('The type of operation.'),
});
export type GenerateSocialCardPostInput = z.infer<typeof GenerateSocialCardPostInputSchema>;

const GenerateSocialCardPostOutputSchema = z.object({
  postText: z.string().describe("The generated social media post caption."),
});
export type GenerateSocialCardPostOutput = z.infer<typeof GenerateSocialCardPostOutputSchema>;


export async function generateSocialCardPost(input: GenerateSocialCardPostInput): Promise<GenerateSocialCardPostOutput> {
  // Funcionalidade de IA desativada temporariamente.
  return Promise.reject(new Error("A funcionalidade de geração de post por IA está em construção."));
}
