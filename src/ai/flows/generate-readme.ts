
'use server';

/**
 * @fileOverview Generates a README file content based on a GitHub repository URL,
 * leveraging fetched repository details including the content of key files from the entire repo tree
 * and contributor information. It can also translate the generated README into multiple languages.
 *
 * - generateReadme - A function that generates the README content and its translations.
 * - GenerateReadmeInput - The input type for the generateReadme function.
 * - GenerateReadmeOutput - The return type for the generateReadme function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { fetchRepoInfoTool, type GithubRepoToolOutput } from '@/ai/tools/github-repo-tool';
import { translateReadme } from './translate-readme';

const GenerateReadmeInputSchema = z.object({
  repoUrl: z.string().describe('The URL of the public GitHub repository.'),
  githubToken: z.string().optional().describe('An optional GitHub Personal Access Token for private repositories.'),
  readmeLength: z.enum(['short', 'medium', 'long']).default('medium').optional().describe('The desired length of the README (short, medium, or long).'),
  includeEmojis: z.boolean().default(false).optional().describe('Whether to include emojis in the README.'),
  targetLanguages: z.array(z.string()).optional().describe('An array of target languages for translation.'),
});
export type GenerateReadmeInput = z.infer<typeof GenerateReadmeInputSchema>;

const ReadmeObjectSchema = z.object({
  language: z.string(),
  fileName: z.string(),
  content: z.string(),
});
export type ReadmeObject = z.infer<typeof ReadmeObjectSchema>;

const GenerateReadmeOutputSchema = z.object({
  readmes: z.array(ReadmeObjectSchema).describe('An array of generated READMEs, including the original and any requested translations.'),
  debugInfo: z.any().optional().describe('Debugging information from the tool call, like fetched file list and contributors.'),
});
export type GenerateReadmeOutput = z.infer<typeof GenerateReadmeOutputSchema>;

export async function generateReadme(input: GenerateReadmeInput): Promise<GenerateReadmeOutput> {
  return generateReadmeFlow(input);
}

const SingleReadmeOutputSchema = z.object({
  readmeContent: z.string().describe('The generated content of the README file in English.'),
});

const prompt = ai.definePrompt({
  name: 'generateReadmePrompt',
  input: {schema: z.object({
    repoUrl: z.string(),
    githubTokenProvided: z.boolean(), 
    repoInfo: z.custom<GithubRepoToolOutput>(),
    readmeLength: z.enum(['short', 'medium', 'long']).default('medium').optional(),
    includeEmojis: z.boolean().default(false).optional(),
  })},
  output: {schema: SingleReadmeOutputSchema},
  system: `You are an expert AI technical writer tasked with generating a professional and comprehensive README.md file for a GitHub repository.
You have been provided with detailed information about the repository, including its metadata, the content of key files, and a list of contributors.

**Core Instructions:**

0.  **Handle Tool Errors First:** If \`repoInfo.error\` is present, output ONLY a brief error message for \`readmeContent\` and stop. Example: "## Unable to Analyze Repository\\n\\nI was unable to fetch repository details. Error: {{{repoInfo.error}}}.\\n\\nPlease check the URL and token."

1.  **Deep Analysis of Provided File Contents (\`repoInfo.repoContents\`):** Synthesize project purpose, functionalities, technologies, and setup/usage from this data.

2.  **Handling an Existing README:** If present in \`repoInfo.repoContents\`, use it as a source but prioritize generating a *new*, comprehensive README based on all available file content. If no existing README or it's minimal, generate from scratch.

3.  **Fact-Based Generation:** Base your README strictly on information in \`repoInfo\`. Do NOT hallucinate.

4.  **README Length & Emojis:** Adhere to \`readmeLength\` and \`includeEmojis\` parameters.

5.  **Structure the README:** Generate well-structured Markdown. Essential sections include:
    *   Project Title
    *   Project Description
    *   Key Features
    *   Technologies Used (List Radix UI packages collectively if multiple, e.g., '@radix-ui').
    *   Prerequisites
    *   Installation / Setup Instructions
    *   Usage Examples (Derive from source code \`content\`. If unable, explain why but describe general workflow).
    *   **Contributors ✨:** (If \`repoInfo.contributors\` is valid and present)
        *   Generate a 'Contributors ✨' section.
        *   For each contributor, create a linked image inside a table cell. **IMPORTANT: DO NOT include the contributor's name as visible text.** The linked avatar image should be the only content in the cell. The link should point to their profile, and the hover text (title attribute) should be their username.
        *   Use an HTML table in Markdown as per the example format:
            \`\`\`html
            <td align="center"><a href="CONTRIBUTOR_HTML_URL" title="CONTRIBUTOR_LOGIN"><img src="CONTRIBUTOR_AVATAR_URL?v=4" width="100px;" alt="CONTRIBUTOR_LOGIN"/></a></td>
            \`\`\`
        *   Arrange these cells inside \`<table><tr>...</tr></table>\`.
        *   If contributor data is insufficient, omit this section entirely.
    *   Contributing (Standard placeholder unless specific guidelines found).
    *   **License:** Identify from license file content in \`repoInfo.repoContents\`. If none, state: "No license.".

6.  **Markdown Formatting:** Use clear, consistent Markdown with language tags for code blocks. Ensure complete sentences and sections.

7.  **No Attribution Footer:** DO NOT add any "Generated by..." or similar attribution footers to the \`readmeContent\`. The application will handle this separately.

**Output Format:** The output MUST be a single JSON object with a 'readmeContent' field containing the entire Markdown string for the README.
`,
    prompt: `Repository URL: {{{repoUrl}}}
GitHub Token Provided: {{{githubTokenProvided}}}
README Length: {{{readmeLength}}}
Include Emojis: {{{includeEmojis}}}

**Fetched Repository Information (repoInfo):**
\\\`\\\`\\\`json
{{{json repoInfo}}}
\\\`\\\`\\\`

**Instruction Reminder:**
*   **If \`repoInfo.error\` is present:** Output ONLY a brief error message as specified in system instruction #0.
*   **Otherwise:** Generate a full README.
    *   Analyze actual file contents from \`repoInfo.repoContents\`.
    *   For "Contributors ✨", use the HTML table format with **only the linked avatar image** (no text name) if \`repoInfo.contributors\` is valid, as specified in the system instructions.
    *   For "License", identify from license file content, or state "No license." if not found.
    *   DO NOT add any "Generated by..." style footers.
Ensure all sections are complete. Output valid JSON with 'readmeContent'.
`,
});

const generateReadmeFlow = ai.defineFlow(
  {
    name: 'generateReadmeFlow',
    inputSchema: GenerateReadmeInputSchema,
    outputSchema: GenerateReadmeOutputSchema,
  },
  async (input) => {
    const repoInfo = await fetchRepoInfoTool({ 
        repoUrl: input.repoUrl, 
        githubToken: input.githubToken
    });

    // Early exit with error message if tool fails, before calling the main LLM
    if (repoInfo.error) {
        const errorContent = `## Unable to Analyze Repository\n\nI was unable to fetch repository details. Error: ${repoInfo.error}.\n\nPlease check the URL and that the repository is public (or that a valid token is provided for a private repo).`;
        return {
            readmes: [{
                language: 'Error',
                fileName: 'ERROR.md',
                content: errorContent
            }],
            debugInfo: repoInfo
        };
    }
    
    const llmResponse = await prompt({
      repoUrl: input.repoUrl,
      githubTokenProvided: !!input.githubToken,
      repoInfo: repoInfo,
      readmeLength: input.readmeLength,
      includeEmojis: input.includeEmojis,
    });

    const output = llmResponse.output;

    if (!output || !output.readmeContent) {
      let errorMessage = 'README generation failed to produce content. ';
      if (!repoInfo.repoContents || repoInfo.repoContents.length === 0) {
        errorMessage += 'No files or content could be retrieved from the repository, or no relevant files were selected for content fetching. ';
      } else {
         errorMessage += 'The AI model might have encountered an issue, the repository data could not be processed effectively, or the response was empty. ';
      }
      errorMessage += 'Ensure the repository URL is correct and the repository is publicly accessible (or a valid token is provided for private repos). If it is, try a different repository or check back later.';
      console.error("generateReadmeFlow error details:", {
        input,
        repoInfo,
        llmOutput: output,
      });
      throw new Error(errorMessage);
    }
    
    const originalReadmeContent = output.readmeContent;
    const footer = "\n\n---\nGenerated by [ReadMeMagic](https://github.com/slammers001/readme-ai-generator)";

    const finalReadmes: ReadmeObject[] = [{
        language: 'English',
        fileName: 'README.md',
        content: originalReadmeContent + footer,
    }];
    
    // Handle translations if requested
    if (input.targetLanguages && input.targetLanguages.length > 0) {
        const languageMap: Record<string, string> = {
            'Spanish': 'es', 'French': 'fr', 'German': 'de', 'Japanese': 'ja', 'Chinese (Simplified)': 'zh', 'Portuguese': 'pt', 'Russian': 'ru', 'Italian': 'it', 'Korean': 'ko',
        };

        const translationPromises = input.targetLanguages.map(async (lang) => {
            try {
                // Translate the content *before* the footer is added for better translation context
                const translationResult = await translateReadme({
                    readmeContent: originalReadmeContent,
                    targetLanguage: lang,
                });
                
                if (translationResult.translatedContent) {
                    const langCode = languageMap[lang] || lang.substring(0, 2).toLowerCase();
                    return {
                        language: lang,
                        fileName: `README.${langCode}.md`,
                        content: translationResult.translatedContent + footer, // Add footer after translation
                    };
                }
            } catch (e) {
                console.error(`Failed to translate to ${lang}:`, e);
                // Optionally add error info to debug output if needed
            }
            return null;
        });

        const translatedResults = (await Promise.all(translationPromises)).filter((r): r is ReadmeObject => r !== null);
        finalReadmes.push(...translatedResults);
    }

    return { readmes: finalReadmes, debugInfo: repoInfo };
  }
);
