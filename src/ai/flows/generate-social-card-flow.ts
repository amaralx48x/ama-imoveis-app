
'use server';
/**
 * @fileOverview Flow to generate a social media card for a property.
 *
 * - generateSocialCard - A function that combines a property image, agent logo, and price into a social media post.
 * - GenerateSocialCardInput - The input type for the function.
 * - GenerateSocialCardOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Helper to convert image URL to Data URI
async function imageUrlToDataURI(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:${contentType};base64,${base64}`;
}


const GenerateSocialCardInputSchema = z.object({
  propertyImageUrl: z.string().url().describe('A URL of the main property photo.'),
  logoImageUrl: z.string().url().optional().describe('An optional URL of the agent\'s logo.'),
  price: z.string().describe('The formatted price of the property (e.g., "R$ 500.000,00").'),
  operation: z.enum(['Venda', 'Aluguel']).describe('The type of operation.'),
});
export type GenerateSocialCardInput = z.infer<typeof GenerateSocialCardInputSchema>;

const GenerateSocialCardOutputSchema = z.object({
  imageUrl: z.string().describe("The generated image as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."),
});
export type GenerateSocialCardOutput = z.infer<typeof GenerateSocialCardOutputSchema>;


const socialCardPrompt = ai.definePrompt(
  {
    name: 'socialCardPrompt',
    input: {
        schema: z.object({
            propertyImageDataUri: z.string(),
            logoImageDataUri: z.string().optional(),
            price: z.string(),
            operation: z.string(),
        })
    },
    output: { format: 'media' },
    prompt: `
        You are a graphic designer specializing in real estate social media posts.
        Your task is to create a visually appealing Instagram Story (9:16 aspect ratio) based on the provided images and text.

        Instructions:
        1.  Use the property image as the main background. The image should be visible and attractive.
        2.  If a logo is provided, place it tastefully in one of the corners (e.g., top-left or bottom-right). The logo should be visible but not obstructive.
        3.  Display the price in a prominent, large, and stylish font. Use a contrasting color to ensure readability against the background.
        4.  If the operation is 'Aluguel', add "/mês" next to the price in a smaller font.
        5.  The final image should look professional, clean, and modern. Do not add any extra text or elements not specified.
        6.  The output must be only the final image.

        Property Image: {{media url=propertyImageDataUri}}
        {{#if logoImageDataUri}}
        Logo: {{media url=logoImageDataUri}}
        {{/if}}
        Price: {{{price}}}
        Operation: {{{operation}}}
    `,
  },
);


const generateSocialCardFlow = ai.defineFlow(
  {
    name: 'generateSocialCardFlow',
    inputSchema: GenerateSocialCardInputSchema,
    outputSchema: GenerateSocialCardOutputSchema,
  },
  async (input) => {
    
    // Convert image URLs to data URIs in parallel
    const [propertyImageDataUri, logoImageDataUri] = await Promise.all([
        imageUrlToDataURI(input.propertyImageUrl),
        input.logoImageUrl ? imageUrlToDataURI(input.logoImageUrl) : Promise.resolve(undefined)
    ]);
    
    const { media } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
            { media: { url: propertyImageDataUri }},
            ...(logoImageDataUri ? [{ media: { url: logoImageDataUri }}] : []),
            { text: `
                You are a graphic designer specializing in real estate social media posts.
                Your task is to create a visually appealing Instagram Story (9:16 aspect ratio) based on the provided images and text.

                Instructions:
                1. Use the first image (property image) as the main background. The image should be visible and attractive.
                2. The second image is a logo. Place it tastefully in one of the corners (e.g., top-left or bottom-right). The logo should be visible but not obstructive.
                3. Display the price: "${input.price}" in a prominent, large, and stylish font. Use a contrasting color to ensure readability against the background.
                4. If the operation is 'Aluguel', add "/mês" next to the price in a smaller font.
                5. The final image should look professional, clean, and modern. Do not add any extra text or elements not specified.
                6. The output must be only the final image.
            `},
        ],
        config: {
            responseModalities: ['IMAGE'],
            generationConfig: {
                 aspectRatio: '9:16',
            }
        },
    });

    if (!media?.url) {
      throw new Error('Image generation failed to return a media object.');
    }

    return { imageUrl: media.url };
  }
);


export async function generateSocialCard(input: GenerateSocialCardInput): Promise<GenerateSocialCardOutput> {
  return generateSocialCardFlow(input);
}
