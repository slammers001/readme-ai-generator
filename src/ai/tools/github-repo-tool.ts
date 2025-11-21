
/**
 * @fileOverview A Genkit tool to fetch detailed information from a GitHub repository,
 * including the content of key files from the entire repository tree and a list of contributors.
 *
 * - fetchRepoInfoTool - The Genkit tool definition.
 * - GithubRepoToolInput - Input type for the tool (repoUrl).
 * - GithubRepoToolOutput - Output type for the tool.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MAX_FILES_FOR_CONTENT_FETCH = 12; // Max number of files to attempt to fetch content for
const MAX_FILE_CONTENT_LENGTH = 20000; // Max characters to fetch per file
const GITHUB_API_BASE_URL = 'https://api.github.com';
const MAX_CONTRIBUTORS_TO_FETCH = 15;

// Helper to identify common manifest/config files
const MANIFEST_FILES_REGEX = /^(package\.json|pnpm-lock\.yaml|yarn\.lock|package-lock\.json|pyproject\.toml|poetry\.lock|requirements\.txt|composer\.json|composer\.lock|Gemfile|Gemfile\.lock|pom\.xml|build\.gradle|Cargo\.toml|Cargo\.lock|go\.mod|go\.sum|Makefile|Dockerfile|docker-compose\.ya?ml)$/i;
const README_FILES_REGEX = /^README(\.(md|rst|txt|markdown))?$/i;
const LICENSE_FILES_REGEX = /^(LICENSE|COPYING)(\.(md|txt|rst))?$/i;
const SOURCE_FILE_EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.go', '.rs', '.rb', '.php', '.cs', '.c', '.cpp', '.swift', '.kt', '.m', '.scala', '.pl', '.sh', '.lua', '.sql', '.html', '.css', '.vue'];
const COMMON_SOURCE_DIRS_REGEX = /^(src|lib|app|source|sources|include|pkg|cmd|internal|core|main|server|client)\//i;
const TEST_DIRS_REGEX = /^(test|tests|spec|e2e)\//i;
const DOCS_DIRS_REGEX = /^(doc|docs|documentation|examples)\//i;


const GithubRepoToolFileSchema = z.object({
  name: z.string().describe('The name of the file or directory.'),
  path: z.string().describe('The full path of the file or directory from the repo root.'),
  type: z.enum(['file', 'dir', 'symlink']).describe('The type of the item (file, dir, or symlink).'),
  size: z.number().optional().describe('The size of the file in bytes, if applicable.'),
  content: z.string().optional().describe('The text content of the file, if fetched and applicable (truncated if too long).'),
  url: z.string().url().optional().describe('The GitHub API URL for the file content (if directly fetchable).'),
  download_url: z.string().url().nullable().optional().describe('The GitHub raw download URL for the file content (if a file).'),
  sha: z.string().optional().describe('The SHA of the git object.'),
  error: z.string().optional().describe('Any error message if fetching content for this specific file failed.'),
});
type GithubRepoToolFile = z.infer<typeof GithubRepoToolFileSchema>;

const GithubContributorSchema = z.object({
  login: z.string().describe("The contributor's GitHub username."),
  avatar_url: z.string().url().describe("URL to the contributor's avatar image."),
  html_url: z.string().url().describe("URL to the contributor's GitHub profile page."),
  contributions: z.number().optional().describe("Number of contributions by the user. Not always used in README but fetched.")
});
export type GithubContributor = z.infer<typeof GithubContributorSchema>;


const GithubRepoToolInputSchema = z.object({
  repoUrl: z.string().url().describe('The full URL of the public GitHub repository (e.g., https://github.com/owner/repo).'),
  githubToken: z.string().optional().describe('Optional GitHub Personal Access Token for private repositories.'),
});
export type GithubRepoToolInput = z.infer<typeof GithubRepoToolInputSchema>;

const GithubRepoToolOutputSchema = z.object({
  repoName: z.string().optional().describe('The name of the repository.'),
  description: z.string().nullable().optional().describe('The description of the repository from GitHub.'),
  mainLanguage: z.string().nullable().optional().describe('The primary programming language of the repository from GitHub.'),
  repoContents: z.array(GithubRepoToolFileSchema).optional().describe('A list of key files from the repository, potentially including their content. Files from subdirectories are included.'),
  contributors: z.array(GithubContributorSchema).optional().describe('A list of top contributors to the repository.'),
  error: z.string().optional().describe('Any general error message if fetching data failed.'),
  toolInput: GithubRepoToolInputSchema.optional().describe('The input provided to the tool, for context.'),
});
export type GithubRepoToolOutput = z.infer<typeof GithubRepoToolOutputSchema>;


async function fetchFileContent(file: { path: string, sha?: string, download_url?: string | null }, owner: string, repo: string, defaultBranch: string, headers: HeadersInit): Promise<{ content?: string; error?: string }> {
  let downloadUrl = file.download_url;
  if (!downloadUrl && file.sha && file.path) {
    downloadUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${encodeURIComponent(file.path)}`;
  }

  if (!downloadUrl) {
    return { error: `No download URL could be constructed for file: ${file.path}` };
  }

  try {
    const contentResponse = await fetch(downloadUrl, { headers });
    if (contentResponse.ok) {
      const textContent = await contentResponse.text();
      if (textContent.length > MAX_FILE_CONTENT_LENGTH) {
        return { content: textContent.substring(0, MAX_FILE_CONTENT_LENGTH) + "\n... (file content truncated)" };
      }
      return { content: textContent };
    } else if (contentResponse.status === 404) {
      return { error: `File content not found at ${downloadUrl} (404).` };
    } else {
      return { error: `Failed to fetch file content from ${downloadUrl}. Status: ${contentResponse.status} ${contentResponse.statusText}` };
    }
  } catch (e: any) {
    console.error(`Error fetching content for ${file.path}:`, e);
    return { error: `Exception fetching file content: ${e.message}` };
  }
}

function getFilePriority(file: { path: string, name: string }): number {
  const lowerPath = file.path.toLowerCase();
  if (README_FILES_REGEX.test(file.name)) return 1;
  if (LICENSE_FILES_REGEX.test(file.name)) return 2;
  if (MANIFEST_FILES_REGEX.test(file.name)) return 3;
  if (SOURCE_FILE_EXTENSIONS.some(ext => lowerPath.endsWith(ext))) {
    if (COMMON_SOURCE_DIRS_REGEX.test(lowerPath)) return 4;
    if (lowerPath.includes('main') || lowerPath.includes('app') || lowerPath.includes('index') || lowerPath.includes('config')) return 5;
    if (!TEST_DIRS_REGEX.test(lowerPath) && !DOCS_DIRS_REGEX.test(lowerPath)) return 6;
  }
  if (DOCS_DIRS_REGEX.test(lowerPath) && SOURCE_FILE_EXTENSIONS.some(ext => lowerPath.endsWith(ext))) return 7;
  return 10;
}


export const fetchRepoInfoTool = ai.defineTool(
  {
    name: 'fetchRepoInfoTool',
    description: `Fetches detailed information about a GitHub repository (public or private if a token is provided), 
                  including its description, primary language, the content of key files 
                  (like READMEs, license files, manifest files, and selected source files from the entire repository tree),
                  and a list of top contributors.
                  Requires a repository URL and an optional GitHub Personal Access Token.`,
    inputSchema: GithubRepoToolInputSchema,
    outputSchema: GithubRepoToolOutputSchema,
  },
  async ({repoUrl, githubToken}) => {
    let owner: string, repo: string;
    try {
      const parsedUrl = new URL(repoUrl);
      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
      if (pathParts.length < 2) {
        return {error: 'Invalid GitHub repository URL format. Could not extract owner/repo.', toolInput: {repoUrl, githubToken}};
      }
      owner = pathParts[0];
      repo = pathParts[1].replace(/\.git$/, '');
    } catch (e: any) {
      return {error: `Invalid repository URL: ${e.message}`, toolInput: {repoUrl, githubToken}};
    }

    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }

    let repoDetails: any;
    try {
      const repoDetailsResponse = await fetch(`${GITHUB_API_BASE_URL}/repos/${owner}/${repo}`, {headers});
      if (!repoDetailsResponse.ok) {
        let errorMsg = `Failed to fetch repository details. Status: ${repoDetailsResponse.status} ${repoDetailsResponse.statusText}. `;
        if (repoDetailsResponse.status === 404) {
            errorMsg += `This could be an invalid URL or a private repository for which the provided token (if any) is invalid or lacks permissions.`;
        } else if (repoDetailsResponse.status === 401 || repoDetailsResponse.status === 403) {
            errorMsg += `Authentication failed. Ensure your GitHub Personal Access Token is correct and has the 'repo' scope if accessing a private repository.`;
        } else {
            errorMsg += `This could also be due to API rate limits.`;
        }
        return {
          error: errorMsg,
          toolInput: {repoUrl, githubToken},
        };
      }
      repoDetails = await repoDetailsResponse.json();
    } catch (e: any) {
      console.error('Error fetching repo details:', e);
      return {error: `Exception fetching repository details: ${e.message}`, toolInput: {repoUrl, githubToken}};
    }

    const defaultBranch = repoDetails.default_branch || 'master';
    let allFilesFromTree: GithubRepoToolFile[] = [];

    try {
      const treeResponse = await fetch(`${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=true`, { headers });
      if (treeResponse.ok) {
        const treeData = await treeResponse.json();
        if (treeData.truncated) {
          console.warn(`Repository tree for ${repoUrl} was truncated by GitHub API. May not see all files.`);
        }
        allFilesFromTree = treeData.tree
          .map((item: any) => ({
            name: item.path.split('/').pop() || item.path,
            path: item.path,
            type: item.type === 'blob' ? 'file' : (item.type === 'tree' ? 'dir' : 'symlink'),
            size: item.size,
            sha: item.sha,
            url: item.url,
            download_url: item.type === 'blob' ? `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${encodeURIComponent(item.path)}` : null
          }));
      } else {
        console.warn(`Failed to fetch recursive tree for ${repoUrl}: ${treeResponse.status}. Falling back to top-level contents (less comprehensive).`);
        const contentsResponse = await fetch(`${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/contents?ref=${defaultBranch}`, { headers });
        if (contentsResponse.ok) {
            const topLevelContents = await contentsResponse.json();
            allFilesFromTree = topLevelContents.map((item: any) => ({
                name: item.name,
                path: item.path,
                type: item.type,
                size: item.size,
                sha: item.sha,
                url: item.url,
                download_url: (item.download_url && String(item.download_url).trim() !== '') ? String(item.download_url).trim() : null,
            }));
        } else {
             return { error: `Failed to fetch repository contents. Tree Error: ${treeResponse.statusText}, Contents Error: ${contentsResponse.statusText}`, toolInput: {repoUrl, githubToken} };
        }
      }
    } catch (e: any) {
      console.error(`Exception fetching repository tree for ${repoUrl}: ${e.message}`);
      return { error: `Exception fetching repository tree structure: ${e.message}`, toolInput: {repoUrl, githubToken}};
    }
    
    const filesOnly = allFilesFromTree.filter(f => f.type === 'file' && f.path);
    filesOnly.sort((a, b) => getFilePriority(a) - getFilePriority(b));

    const repoContents: GithubRepoToolFile[] = [];
    let fetchedContentCount = 0;

    for (const file of filesOnly) {
      if (fetchedContentCount < MAX_FILES_FOR_CONTENT_FETCH) {
          const isPriorityFile = README_FILES_REGEX.test(file.name) || MANIFEST_FILES_REGEX.test(file.name) || LICENSE_FILES_REGEX.test(file.name);
          if (file.size && file.size > MAX_FILE_CONTENT_LENGTH * 3 && !isPriorityFile) { 
             repoContents.push({ ...file, content: undefined, error: `File too large to fetch content (${file.size} bytes). Not a priority file.` });
          } else {
            const { content, error } = await fetchFileContent(file, owner, repo, defaultBranch, headers);
            const fileWithContent: GithubRepoToolFile = { ...file, content: content };
            if (error) fileWithContent.error = error;
            repoContents.push(fileWithContent); 
            if (content && !error) { // Increment only if content was successfully fetched
                fetchedContentCount++;
            }
          }
      } else {
         if (README_FILES_REGEX.test(file.name) || MANIFEST_FILES_REGEX.test(file.name) || LICENSE_FILES_REGEX.test(file.name) || SOURCE_FILE_EXTENSIONS.some(ext => file.path.endsWith(ext))) {
            const minimalFile = { ...file }; 
            delete minimalFile.content;
            minimalFile.error = minimalFile.error || 'Content not fetched due to limit (MAX_FILES_FOR_CONTENT_FETCH reached).';
            repoContents.push(minimalFile);
        }
      }
    }
    
    repoContents.sort((a, b) => getFilePriority(a) - getFilePriority(b));

    let contributorsList: GithubContributor[] | undefined = undefined;
    try {
      const contributorsResponse = await fetch(`${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/contributors?anon=0&per_page=${MAX_CONTRIBUTORS_TO_FETCH}`, { headers });
      if (contributorsResponse.ok) {
        const contributorsData = await contributorsResponse.json();
        if (Array.isArray(contributorsData)) {
          contributorsList = contributorsData
            .filter(contrib => contrib.type !== 'Bot' && contrib.login && contrib.avatar_url && contrib.html_url) // Filter out bots and ensure essential fields
            .map((contrib: any) => ({
              login: contrib.login,
              avatar_url: contrib.avatar_url,
              html_url: contrib.html_url,
              contributions: contrib.contributions,
            }))
            .slice(0, MAX_CONTRIBUTORS_TO_FETCH);
        }
      } else {
        console.warn(`Failed to fetch contributors for ${repoUrl}: ${contributorsResponse.status} ${contributorsResponse.statusText}. This will not block README generation.`);
      }
    } catch (e: any) {
      console.warn(`Exception fetching contributors for ${repoUrl}: ${e.message}. This will not block README generation.`);
    }

    return {
      repoName: repoDetails.name,
      description: repoDetails.description,
      mainLanguage: repoDetails.language,
      repoContents: repoContents.length > 0 ? repoContents : undefined,
      contributors: contributorsList,
      toolInput: {repoUrl, githubToken},
    };
  }
);
