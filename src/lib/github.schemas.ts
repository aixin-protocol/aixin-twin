import { z } from "zod";

export const githubFileSchema = z.object({ path: z.string().min(1), content: z.string() });

export const githubRepoSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().default("main"),
});

export const getRepoFileSchema = githubRepoSchema.extend({ path: z.string().min(1) });

export const previewCommitSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().default("main"),
  files: z.array(githubFileSchema).min(1),
});

export const commitToGitHubSchema = previewCommitSchema.extend({
  message: z.string().min(1),
});

export type GithubFileInput = z.infer<typeof githubFileSchema>;