import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { commitToGitHubSchema, getRepoFileSchema, previewCommitSchema } from "@/lib/github.schemas";
import { commitFilesToGitHub, createGithubClient, fetchRepoFile, isMissingGithubContent } from "@/lib/github.server";

export const getRepoFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => getRepoFileSchema.parse(d))
  .handler(async ({ data }) => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const githubKey = process.env.GITHUB_API_KEY;
    if (!lovableKey || !githubKey) {
      throw new Error("GitHub connector is not configured. Link the GitHub connector first.");
    }
    const client = createGithubClient({ lovableKey, githubKey });
    const existing = await fetchRepoFile(client, data.owner, data.repo, data.path, data.branch);
    return { path: data.path, sha: existing.sha, content: existing.content };
  });

export const previewCommit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => previewCommitSchema.parse(d))
  .handler(async ({ data }) => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const githubKey = process.env.GITHUB_API_KEY;
    if (!lovableKey || !githubKey) {
      throw new Error("GitHub connector is not configured. Link the GitHub connector first.");
    }
    const client = createGithubClient({ lovableKey, githubKey });
    const items = await Promise.all(
      data.files.map(async (file) => {
        try {
          const existing = await fetchRepoFile(client, data.owner, data.repo, file.path, data.branch);
          return {
            path: file.path,
            status: existing.content === file.content ? ("unchanged" as const) : ("modified" as const),
            oldContent: existing.content,
            newContent: file.content,
            oldSha: existing.sha,
          };
        } catch (e) {
          if (isMissingGithubContent(e)) {
            return {
              path: file.path,
              status: "new" as const,
              oldContent: null,
              newContent: file.content,
              oldSha: null,
            };
          }
          throw e;
        }
      }),
    );
    return { owner: data.owner, repo: data.repo, branch: data.branch, files: items };
  });

export const commitToGitHub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => commitToGitHubSchema.parse(d))
  .handler(async ({ data }) => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const githubKey = process.env.GITHUB_API_KEY;
    if (!lovableKey || !githubKey) {
      throw new Error("GitHub connector is not configured. Link the GitHub connector first.");
    }
    const client = createGithubClient({ lovableKey, githubKey });
    return commitFilesToGitHub(client, data);
  });
