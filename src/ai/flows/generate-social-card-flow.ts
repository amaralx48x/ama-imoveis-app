
'use server';
/**
 * @fileOverview Flow to generate a social media post for a property.
 *
 * - generateSocialCardPost - A function that takes a property description and generates a catchy social media caption.
 * - GenerateSocialCardPostInput - The input type for the function.
 * - GenerateSocialCardPostOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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


const generateSocialCardPostFlow = ai.defineFlow(
  {
    name: 'generateSocialCardPostFlow',
    inputSchema: GenerateSocialCardPostInputSchema,
    outputSchema: GenerateSocialCardPostOutputSchema,
  },
  async (input) => {
    
    const prompt = `
        Você é um especialista em marketing de redes sociais para o mercado imobiliário.
        Sua tarefa é pegar a descrição de um imóvel e transformá-la em uma legenda curta, atraente e eficaz para um post no Instagram ou Facebook.

        Instruções:
        1. Comece com uma frase de impacto que capture a atenção.
        2. Destaque 2 ou 3 das características mais importantes do imóvel de forma concisa.
        3. Inclua o preço de forma clara: "${input.price}" ${input.operation === 'Aluguel' ? '/mês' : ''}.
        4. Use 3 a 5 hashtags relevantes e populares no final (ex: #imoveis #casapropria #investimentoimobiliario).
        5. Termine com uma chamada para ação clara, incentivando o contato ou clique no link da bio.
        6. A legenda inteira deve ser curta e fácil de ler. Não use mais que 4 parágrafos pequenos ou itens de lista.

        Descrição original do imóvel para se basear:
        ---
        ${input.description}
        ---

        Gere apenas o texto da legenda para o campo 'postText' do JSON de saída.
    `;

    const { text } = await ai.generate({
        prompt: prompt,
        model: 'googleai/gemini-2.5-flash',
    });

    return { postText: text };
  }
);


export async function generateSocialCardPost(input: GenerateSocialCardPostInput): Promise<GenerateSocialCardPostOutput> {
  return generateSocialCardPostFlow(input);
}
