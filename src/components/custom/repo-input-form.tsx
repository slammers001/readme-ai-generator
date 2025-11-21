
"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Github, Wand2, Loader2, ListTree, Smile, KeyRound, Info, Sparkles, Code, Languages, ChevronDown } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";


const formSchema = z.object({
  repoUrl: z.string().url({ message: "Please enter a valid GitHub repository URL." })
    .regex(/^(https|http):\/\/github\.com\/[\w-]+\/[\w.-]+(\.git)?\/?$/, "Must be a valid public GitHub repository URL (e.g., https://github.com/user/repo)."),
  githubToken: z.string().optional(),
  readmeLength: z.enum(['short', 'medium', 'long']).default('medium'),
  includeEmojis: z.boolean().default(false),
  enableTranslation: z.boolean().default(false),
  targetLanguages: z.array(z.string()).optional(),
}).refine(data => {
    if (data.enableTranslation && (!data.targetLanguages || data.targetLanguages.length === 0)) {
        return false;
    }
    return true;
}, {
    message: "If translation is enabled, you must select at least one language.",
    path: ["targetLanguages"],
});


export type RepoInputFormValues = z.infer<typeof formSchema>;

interface RepoInputFormProps {
  onSubmit: (values: RepoInputFormValues) => void;
  isLoading: boolean;
  initialValues?: RepoInputFormValues;
}

const availableLanguages = [
    { id: 'Spanish', label: 'Spanish' },
    { id: 'French', label: 'French' },
    { id: 'German', label: 'German' },
    { id: 'Japanese', label: 'Japanese' },
    { id: 'Chinese (Simplified)', label: 'Chinese (Simplified)' },
    { id: 'Portuguese', label: 'Portuguese' },
    { id: 'Russian', label: 'Russian' },
    { id: 'Italian', label: 'Italian' },
    { id: 'Korean', label: 'Korean' },
];

export function RepoInputForm({ onSubmit, isLoading, initialValues }: RepoInputFormProps) {
  const form = useForm<RepoInputFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues || {
      repoUrl: "",
      githubToken: "",
      readmeLength: "medium",
      includeEmojis: false,
      enableTranslation: false,
      targetLanguages: [],
    },
  });

  const translationEnabled = form.watch("enableTranslation");

  return (
    <Card className="w-full shadow-2xl bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Wand2 className="mr-2 h-6 w-6 text-primary" />
          Generate Your Readme
        </CardTitle>
        <CardDescription>
          Enter a GitHub repository URL. For private repos, provide a Personal Access Token.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="instructions">
                <AccordionTrigger>
                  <div className="flex items-center text-base font-medium text-primary hover:text-primary/90">
                    <Info className="mr-2 h-5 w-5" />
                    How to Use & PAT Guide
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4 text-sm">
                   <div className="p-4 bg-muted/50 rounded-md border border-input">
                       <h3 className="font-semibold flex items-center mb-2 text-base">
                           <Sparkles className="mr-3 h-6 w-6 text-primary" />
                           Welcome to ReadMeMagic!
                       </h3>
                       <p className="text-muted-foreground text-base">
                           Enter a public GitHub repository URL to get started. Our AI will analyze its structure and key file contents to generate a draft README for you. For private repositories, you can provide a GitHub Personal Access Token.
                       </p>
                   </div>
                   <div className="p-4 bg-muted/50 rounded-md border border-input">
                       <h3 className="font-semibold flex items-center mb-2 text-base"><KeyRound className="mr-2 h-5 w-5 text-accent"/>Private Repositories & PAT:</h3>
                       <p className="text-muted-foreground">
                           For private repositories, generate a
                           <Link href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline"> Personal Access Token (PAT) </Link>
                           with the <code className="text-xs bg-muted p-0.5 rounded-sm">repo</code> scope. Enter it in the form. It&apos;s used for the current session and not stored.
                       </p>
                   </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <FormField
              control={form.control}
              name="repoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center text-base">
                    <Github className="mr-2 h-5 w-5" />
                    GitHub Repository URL
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://github.com/yourusername/your-repo" {...field} className="text-base py-2.5 h-auto"/>
                  </FormControl>
                  <FormDescription>
                    The AI will analyze this repository. Public or private (with token).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="githubToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center text-base">
                    <KeyRound className="mr-2 h-5 w-5" />
                    GitHub Personal Access Token (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="ghp_YourTokenHere..." {...field} className="text-base py-2.5 h-auto" />
                  </FormControl>
                  <FormDescription>
                    Needed if the repository is private. Leave blank for public repos.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Accordion type="single" collapsible defaultValue="options">
                <AccordionItem value="options">
                    <AccordionTrigger>
                        <div className="flex items-center text-base font-medium text-primary hover:text-primary/90">
                           <ChevronDown className="mr-2 h-5 w-5 accordion-chevron"/> Additional Options
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 space-y-6">
                        <FormField
                          control={form.control}
                          name="readmeLength"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center text-base">
                                <ListTree className="mr-2 h-5 w-5" />
                                Desired README Length
                              </FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="text-base py-2.5 h-auto">
                                    <SelectValue placeholder="Select README length" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="short">Short</SelectItem>
                                  <SelectItem value="medium">Medium (Default)</SelectItem>
                                  <SelectItem value="long">Long</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="includeEmojis"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="flex items-center text-base cursor-pointer !m-0">
                                   <Smile className="mr-2 h-5 w-5" />
                                  Include Emojis?
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <div className="space-y-4 rounded-md border p-4 shadow-sm bg-background">
                            <FormField
                              control={form.control}
                              name="enableTranslation"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="flex items-center text-base cursor-pointer">
                                       <Languages className="mr-2 h-5 w-5" />
                                      Enable AI Translation?
                                    </FormLabel>
                                  </div>
                                </FormItem>
                              )}
                            />
                            <div className={cn("space-y-2 transition-all duration-300", !translationEnabled ? "opacity-50 pointer-events-none" : "opacity-100")}>
                                <FormLabel className={cn("text-base", !translationEnabled && "text-muted-foreground")}>Select Languages</FormLabel>
                                <FormDescription>Choose which languages to translate the README into.</FormDescription>
                                <FormField
                                  control={form.control}
                                  name="targetLanguages"
                                  render={({ field }) => (
                                    <FormItem>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 pt-2">
                                        {availableLanguages.map((item) => (
                                          <FormField
                                            key={item.id}
                                            control={form.control}
                                            name="targetLanguages"
                                            render={({ field }) => {
                                              return (
                                                <FormItem
                                                  key={item.id}
                                                  className="flex flex-row items-start space-x-2 space-y-0"
                                                >
                                                  <FormControl>
                                                    <Checkbox
                                                      disabled={!translationEnabled}
                                                      checked={field.value?.includes(item.id)}
                                                      onCheckedChange={(checked) => {
                                                        const currentValue = field.value || [];
                                                        return checked
                                                          ? field.onChange([...currentValue, item.id])
                                                          : field.onChange(
                                                              currentValue?.filter(
                                                                (value) => value !== item.id
                                                              )
                                                            )
                                                      }}
                                                    />
                                                  </FormControl>
                                                  <FormLabel className="font-normal text-sm cursor-pointer">
                                                    {item.label}
                                                  </FormLabel>
                                                </FormItem>
                                              )
                                            }}
                                          />
                                        ))}
                                      </div>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                            </div>
                        </div>

                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-base h-auto" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-5 w-5" />
                  Generate Readme
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
