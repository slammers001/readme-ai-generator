// src/ai/flows/improve-readme.ts
'use server';
/**
 * @fileOverview Allows the user to edit the AI-generated README content, so they can customize it to their specific needs.
 *
 * - improveReadme - A function that handles the README content improvement process.
 * - ImproveReadmeInput - The input type for the improveReadme function.
 * - ImproveReadmeOutput - The return type for the improveReadme function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveReadmeInputSchema = z.object({
  originalReadme: z.string().describe('The original AI-generated README content.'),
  userEdits: z.string().describe('The user-provided edits to the README content.'),
});
export type ImproveReadmeInput = z.infer<typeof ImproveReadmeInputSchema>;

const ImproveReadmeOutputSchema = z.object({
  improvedReadme: z.string().describe('The improved README content after incorporating user edits.'),
});
export type ImproveReadmeOutput = z.infer<typeof ImproveReadmeOutputSchema>;

export async function improveReadme(input: ImproveReadmeInput): Promise<ImproveReadmeOutput> {
  return improveReadmeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'improveReadmePrompt',
  input: {schema: ImproveReadmeInputSchema},
  output: {schema: ImproveReadmeOutputSchema},
  prompt: `You are an expert technical writer. You will be given an AI-generated README content and user edits. Incorporate the user edits into the original README content, while maintaining the original structure and style. Do not add or remove any sections unless the user explicitly requests it.  Do not omit code blocks or change code examples.

Original README:
{{{originalReadme}}}

User Edits:
{{{userEdits}}}

Improved README:
`,
});

const improveReadmeFlow = ai.defineFlow(
  {
    name: 'improveReadmeFlow',
    inputSchema: ImproveReadmeInputSchema,
    outputSchema: ImproveReadmeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
