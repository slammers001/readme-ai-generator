
"use client";

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { ReadmeObject } from '@/ai/flows/generate-readme';

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Sparkles, Edit3, Download, Copy, Loader2, Eye, FileArchive } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

interface Readme {
    lang: string;
    content: string;
}

interface ReadmePreviewProps {
  readmes: ReadmeObject[];
  originalReadmes: Record<string, string>; 
  onImprove: (currentUserEdits: string, fileName: string) => Promise<void>;
  isLoadingImprove: boolean;
}

export function ReadmePreview({ readmes, originalReadmes, onImprove, isLoadingImprove }: ReadmePreviewProps) {
  const [activeTab, setActiveTab] = useState(readmes[0]?.fileName || 'README.md');
  const [editedContents, setEditedContents] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    // Populate edited contents when the initial readmes are loaded
    const initialContents = readmes.reduce((acc, r) => ({ ...acc, [r.fileName]: r.content }), {});
    setEditedContents(initialContents);
    // Set the first tab as active if it's not already
    if (readmes.length > 0 && !readmes.some(r => r.fileName === activeTab)) {
        setActiveTab(readmes[0].fileName);
    }
  }, [readmes]);

  const activeContent = editedContents[activeTab] || "";
  const originalContentForTab = originalReadmes[activeTab] || "";

  const handleImprove = () => {
    onImprove(activeContent, activeTab);
  };
  
  const handleDownload = () => {
    const blob = new Blob([activeContent], { type: 'text/markdown;charset=utf-8;' });
    saveAs(blob, activeTab);
    toast({ title: "Success", description: `${activeTab} downloaded.` });
  };
  
  const handleDownloadAll = async () => {
    const zip = new JSZip();
    readmes.forEach(readme => {
        zip.file(readme.fileName, readme.content);
    });
    
    try {
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "ReadMeMagic-readmes.zip");
        toast({ title: "Success", description: "All READMEs zipped and downloaded." });
    } catch (error) {
        console.error("Error zipping files:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to create zip file." });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent)
      .then(() => {
        toast({ title: "Success", description: "README content copied to clipboard." });
      })
      .catch(err => {
        toast({ variant: "destructive", title: "Error", description: "Failed to copy content." });
      });
  };

  const hasUserEdits = activeContent.trim() !== originalContentForTab.trim();
  const currentLanguage = readmes.find(r => r.fileName === activeTab)?.language || 'File';

  return (
    <Card className="w-full shadow-2xl bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <FileText className="mr-2 h-6 w-6 text-primary" />
          Generated READMEs
        </CardTitle>
        <CardDescription>
          Select a language tab to view, edit, or download the corresponding README file.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {readmes.map(readme => (
                <TabsTrigger key={readme.fileName} value={readme.fileName} className="text-base py-2.5 h-auto data-[state=active]:shadow-md">
                    {readme.language}
                </TabsTrigger>
            ))}
          </TabsList>
          
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="edit" className="text-base py-2.5 h-auto data-[state=active]:shadow-md">
                  <Edit3 className="mr-2 h-5 w-5"/> Edit ({currentLanguage})
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-base py-2.5 h-auto data-[state=active]:shadow-md">
                  <Eye className="mr-2 h-5 w-5"/> Preview ({currentLanguage})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="edit" className="space-y-6">
                <div className="relative">
                  <Textarea
                    value={activeContent}
                    onChange={(e) => setEditedContents(c => ({...c, [activeTab]: e.target.value}))}
                    placeholder={`Edit ${currentLanguage} README...`}
                    rows={25}
                    className="text-sm font-mono bg-background border-2 border-input rounded-md p-4 focus:ring-primary focus:border-primary min-h-[50vh] lg:min-h-[60vh]"
                    aria-label="README Content Editor"
                  />
                </div>
                <div className="flex flex-col sm:flex-row justify-start items-center gap-3">
                  <Button 
                    onClick={handleImprove} 
                    disabled={isLoadingImprove || !activeContent.trim() || !hasUserEdits} 
                    className="bg-accent hover:bg-accent/90 text-accent-foreground py-3 text-base h-auto"
                  >
                    {isLoadingImprove ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-5 w-5" />
                    )}
                    {isLoadingImprove ? 'Improving...' : 'Improve with AI'}
                  </Button>
                </div>
                {hasUserEdits && !isLoadingImprove && (
                   <p className="text-xs text-muted-foreground text-center sm:text-left mt-2">
                     You've made changes. Click "Improve with AI" to apply them with AI assistance.
                   </p>
                )}
              </TabsContent>
              
              <TabsContent value="preview">
                <div className="prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg max-w-none p-4 border border-input rounded-md min-h-[50vh] lg:min-h-[60vh] bg-background overflow-y-auto">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{activeContent || "Nothing to preview."}</ReactMarkdown>
                </div>
              </TabsContent>
            </Tabs>
        </Tabs>
        
        {/* Buttons visible for all tabs */}
        <div className="flex flex-wrap gap-3 mt-6 justify-end">
          <Button onClick={handleCopy} variant="outline" disabled={!activeContent.trim()} className="py-3 text-base h-auto">
            <Copy className="mr-2 h-4 w-4" /> Copy ({currentLanguage})
          </Button>
          <Button onClick={handleDownload} variant="outline" disabled={!activeContent.trim()} className="py-3 text-base h-auto">
            <Download className="mr-2 h-4 w-4" /> Download ({currentLanguage})
          </Button>
          {readmes.length > 1 && (
            <Button onClick={handleDownloadAll} variant="default" className="py-3 text-base h-auto bg-primary hover:bg-primary/90">
                <FileArchive className="mr-2 h-4 w-4" /> Download All (.zip)
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
