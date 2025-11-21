'use server';
/**
 * @fileOverview Translates README content into a specified target language.
 *
 * - translateReadme - A function that handles the translation process.
 * - TranslateReadmeInput - The input type for the translateReadme function.
 * - TranslateReadmeOutput - The return type for the translateReadme function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateReadmeInputSchema = z.object({
  readmeContent: z.string().describe('The original README content in English.'),
  targetLanguage: z.string().describe('The target language for translation (e.g., "Spanish", "French", "Japanese").'),
});
export type TranslateReadmeInput = z.infer<typeof TranslateReadmeInputSchema>;

const TranslateReadmeOutputSchema = z.object({
  translatedContent: z.string().describe('The translated README content.'),
});
export type TranslateReadmeOutput = z.infer<typeof TranslateReadmeOutputSchema>;

export async function translateReadme(input: TranslateReadmeInput): Promise<TranslateReadmeOutput> {
  return translateReadmeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateReadmePrompt',
  input: {schema: TranslateReadmeInputSchema},
  output: {schema: TranslateReadmeOutputSchema},
  system: `You are an expert technical translator. Your task is to translate a GitHub README file into a specified language.

**Key Instructions:**
1.  **Preserve Markdown:** Maintain all original Markdown formatting, including headers, lists, links, bold/italic text, etc.
2.  **Do Not Translate Code:** Do NOT translate code blocks (e.g., \`\`\`sh ... \`\`\`), inline code snippets (e.g., \`variable_name\`), file paths, or technical terms that don't have a standard translation (e.g., "Next.js", "React", "Genkit", "Tailwind CSS", "Vercel").
3.  **Accurate Translation:** Provide a natural and accurate translation of the descriptive text.
4.  **Translate Comments:** If there are comments within code blocks, you should translate the substance of the comment.
5.  **Preserve Links:** Keep all URLs and links exactly as they are.
6.  **Preserve HTML:** Keep any HTML tables or other tags exactly as they are, only translating the visible text content within them if appropriate (e.g., no need to translate contributor usernames).
7.  **Complete Output:** The output must be the full, translated README content in a single block. Do not add any extra explanations or conversational text.`,
  prompt: `Translate the following README content into {{{targetLanguage}}}.

**Original README Content:**
\`\`\`markdown
{{{readmeContent}}}
\`\`\`
`,
});

const translateReadmeFlow = ai.defineFlow(
  {
    name: 'translateReadmeFlow',
    inputSchema: TranslateReadmeInputSchema,
    outputSchema: TranslateReadmeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
