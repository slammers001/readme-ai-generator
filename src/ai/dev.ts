
import { config } from 'dotenv';
config();

import '@/ai/flows/improve-readme.ts';
import '@/ai/flows/generate-readme.ts';
import '@/ai/flows/translate-readme.ts';
import '@/ai/tools/github-repo-tool.ts';
