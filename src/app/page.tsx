
"use client";

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateReadme, GenerateReadmeInput, GenerateReadmeOutput, ReadmeObject } from '@/ai/flows/generate-readme';
import { improveReadme, ImproveReadmeInput } from '@/ai/flows/improve-readme';
import { RepoInputForm, type RepoInputFormValues } from '@/components/custom/repo-input-form';
import { ReadmePreview } from '@/components/custom/readme-preview';
import Logo from '@/components/custom/logo';
import LoadingSpinner from '@/components/custom/loading-spinner';
import { ThemeToggleButton } from '@/components/custom/theme-toggle-button';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Terminal, RefreshCw, Eye, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import rehypeRaw from 'rehype-raw';

type ViewState = 'form' | 'loading' | 'results';

const EXAMPLE_REPO_URL = "https://github.com/slammers001/readme-ai-generator";
const EXAMPLE_README_OBJECT: ReadmeObject = {
  language: 'English',
  fileName: 'README.md',
  content: `
# ✨ readme-ai-generator

This project helps generate README files for GitHub repositories using AI.

## 🚀 Getting Started

1.  Clone the repository:
    \`\`\`sh
    git clone ${EXAMPLE_REPO_URL}.git
    cd readme-ai-generator
    \`\`\`
2.  Set up environment variables by copying \`.env.example\` to \`.env\` and filling in the API key.
3.  Install dependencies:
    \`\`\`sh
    npm install
    \`\`\`
    or
    \`\`\`sh
    yarn install
    \`\`\`
4.  Run the project:
    \`\`\`sh
    npm start
    \`\`\`

## 🛠️ Technologies Used

*   TypeScript
*   Next.js
*   Genkit AI
*   Radix UI
*   Tailwind CSS

## 📄 License

No license.
`
};

interface TranslatedReadme {
  lang: string;
  content: string;
}

export default function Home() {
  const [generatedReadmes, setGeneratedReadmes] = useState<ReadmeObject[]>([]);
  const [originalGeneratedReadmes, setOriginalGeneratedReadmes] = useState<Record<string, string>>({});
  const [isLoadingImprove, setIsLoadingImprove] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [currentView, setCurrentView] = useState<ViewState>('form');
  const { toast } = useToast();
  const [formValues, setFormValues] = useState<RepoInputFormValues | undefined>(undefined);

  const handleGenerateReadme = async (values: RepoInputFormValues) => {
    setCurrentView('loading');
    setError(null);
    setGeneratedReadmes([]);
    setOriginalGeneratedReadmes({});
    setDebugInfo(null);
    setFormValues(values);

    try {
      const input: GenerateReadmeInput = {
        repoUrl: values.repoUrl,
        githubToken: values.githubToken || undefined,
        readmeLength: values.readmeLength,
        includeEmojis: values.includeEmojis,
        targetLanguages: values.enableTranslation ? values.targetLanguages : undefined,
      };
      const result: GenerateReadmeOutput = await generateReadme(input);

      // Handle specific error case where the tool failed but returned a readme-like error message
      if (result.readmes.length === 1 && result.readmes[0].language === 'Error') {
         setError(result.readmes[0].content);
         setDebugInfo(result.debugInfo);
         toast({
            variant: "destructive",
            title: "Repository Analysis Failed",
            description: `Could not analyze repository. Please check the URL and token.`,
        });
      } else if (result.readmes && result.readmes.length > 0) {
        // Full success
        setGeneratedReadmes(result.readmes);
        const originalMap = result.readmes.reduce((acc, r) => ({...acc, [r.fileName]: r.content}), {});
        setOriginalGeneratedReadmes(originalMap);
        setDebugInfo(result.debugInfo);
        setError(null);
        toast({
          title: "READMEs Generated!",
          description: "Your AI-powered READMEs are ready.",
        });
      } else {
        // This case should be rare if the flow always returns something or throws.
        const fallbackError = "An unexpected issue occurred. The AI model did not return any content.";
        setError(fallbackError);
        toast({ variant: "destructive", title: "Generation Failed", description: fallbackError });
      }

    } catch (e) {
      console.error("Error generating README:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Failed to generate README: ${errorMessage}`);
      setGeneratedReadmes([]);
      setOriginalGeneratedReadmes({});
      setDebugInfo(null);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: `${errorMessage}`,
      });
    }
    setCurrentView('results');
  };

  const handleImproveReadme = async (currentUserEdits: string, fileName: string) => {
    const originalReadmeForFile = originalGeneratedReadmes[fileName];
    if (!originalReadmeForFile) {
      setError("Cannot improve README without an initial version for this language.");
      toast({
        variant: "destructive",
        title: "Improvement Error",
        description: "No original README to improve upon.",
      });
      return;
    }
    setIsLoadingImprove(true);
    try {
      const input: ImproveReadmeInput = {
        originalReadme: originalReadmeForFile,
        userEdits: currentUserEdits,
      };
      const result = await improveReadme(input);
      
      // Update the specific readme in the array
      setGeneratedReadmes(currentReadmes => 
        currentReadmes.map(r => 
          r.fileName === fileName 
          ? { ...r, content: result.improvedReadme } 
          : r
        )
      );

      toast({
        title: "README Improved!",
        description: "The AI has refined your README based on your edits.",
      });
    } catch (e) {
      console.error("Error improving README:", e);
      const improvementErrorMessage = e instanceof Error ? e.message : "An unknown error occurred during improvement.";
      setError(`Failed to improve README: ${improvementErrorMessage}`);
      toast({
        variant: "destructive",
        title: "Improvement Failed",
        description: `Could not improve README. ${improvementErrorMessage}`,
      });
    } finally {
      setIsLoadingImprove(false);
    }
  };

  const handleStartNew = () => {
    setGeneratedReadmes([]);
    setOriginalGeneratedReadmes({});
    setError(null);
    setDebugInfo(null);
    setCurrentView('form');
  };

  const handleShowExample = () => {
    setGeneratedReadmes([EXAMPLE_README_OBJECT]);
    setOriginalGeneratedReadmes({ [EXAMPLE_README_OBJECT.fileName]: EXAMPLE_README_OBJECT.content });
    setError(null);
    setDebugInfo(null);
    setCurrentView('results');
    toast({
      title: "Example Loaded",
      description: "Showing an example README.",
    });
  };
  
  const handleDownloadZip = () => {
    const zip = new JSZip();
    const repoName = repoUrl ? new URL(repoUrl).pathname.split('/').filter(Boolean).pop() || 'repository' : 'repository';

    // Add original README
    zip.file(`${repoName}-README.md`, generatedReadme);

    // Add translated READMEs
    translatedReadmes.forEach(t => {
      zip.file(`${repoName}-README.${t.lang}.md`, t.content);
    });

    zip.generateAsync({ type: "blob" })
      .then(function(content) {
        saveAs(content, `${repoName}-readmes.zip`);
        toast({ title: "Success", description: "All README files downloaded as a zip." });
      })
      .catch(err => {
         toast({ variant: "destructive", title: "Error", description: "Failed to create zip file." });
      });
  };


  return (
    <div className="relative flex min-h-screen flex-col items-center p-4 md:p-8 text-foreground">
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
        <ThemeToggleButton />
      </div>
      <Logo />

      {currentView === 'form' && (
        <div className="w-full flex-grow flex items-center justify-center mt-6 md:mt-10">
          <div className="w-full max-w-2xl">
            <RepoInputForm
              onSubmit={handleGenerateReadme}
              isLoading={currentView === 'loading'}
              initialValues={formValues}
            />
          </div>
        </div>
      )}

      {currentView === 'loading' && (
         <div className="w-full flex-grow flex flex-col items-center justify-center mt-6 md:mt-10 space-y-6">
            <Card className="w-full max-w-xl shadow-xl bg-card">
                <CardContent className="p-8 md:p-12 flex justify-center items-center min-h-[250px]">
                    <LoadingSpinner baseSize={28} text="Generating README... this may take a moment, especially if translations are requested." />
                </CardContent>
            </Card>
        </div>
      )}
      
      {currentView === 'results' && (
        <div className="w-full max-w-6xl mt-6 md:mt-10 space-y-6">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
            <Button
              onClick={handleStartNew}
              className="w-full sm:w-auto max-w-xs text-base py-2.5 h-auto bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate New / Clear
            </Button>
            {translatedReadmes.length > 0 && (
                <Button onClick={handleDownloadZip} className="w-full sm:w-auto max-w-xs text-base py-2.5 h-auto">
                    <Download className="mr-2 h-4 w-4" />
                    Download All (.zip)
                </Button>
            )}
          </div>

            <div className="w-full">
              {error ? (
                <Card className="w-full shadow-xl bg-card">
                    <CardHeader>
                        <CardTitle className="flex items-center text-destructive"><Terminal className="mr-2 h-6 w-6"/>Error Generating README</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <Alert variant="destructive" className="w-full">
                           <AlertDescription className="text-base prose dark:prose-invert max-w-none">
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>{error}</ReactMarkdown>
                           </AlertDescription>
                        </Alert>
                         <div className="mt-6 flex justify-center">
                            <Button onClick={handleShowExample} variant="secondary" className="text-base py-2.5 h-auto">
                                <Eye className="mr-2 h-5 w-5" /> View Example README
                            </Button>
                        </div>
                    </CardContent>
                </Card>
              ) : generatedReadmes.length > 0 ? (
                <ReadmePreview
                  readmes={generatedReadmes}
                  originalReadmes={originalGeneratedReadmes}
                  onImprove={handleImproveReadme}
                  isLoadingImprove={isLoadingImprove}
                />
              ) : (
                <Card className="w-full shadow-lg bg-card min-h-[300px] flex flex-col justify-center items-center">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center text-xl">
                      An unexpected error occurred.
                    </CardTitle>
                    <CardDescription className="mt-2 text-base">
                      No README was generated. Please try again.
                    </CardDescription>
                  </CardHeader>
                   <CardContent className="flex flex-col items-center gap-4">
                     <p className="text-muted-foreground">Or, you can view a pre-defined example:</p>
                    <Button onClick={handleShowExample} variant="secondary" className="text-base py-2.5 h-auto">
                      <Eye className="mr-2 h-5 w-5" /> View Example README
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
        </div>
      )}

      <footer className="w-full text-center text-muted-foreground text-base py-10 mt-12 border-t">
        <Link href="https://github.com/slammers001" target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-primary transition-colors group text-base">
          Made by <span className="font-semibold group-hover:underline mx-1">@slammers001</span>
          <ExternalLink className="ml-1.5 h-4 w-4" />
        </Link>
      </footer>
    </div>
  );
}
