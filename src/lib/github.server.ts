const GATEWAY_URL = "https://connector-gateway.lovable.dev/github";

type GithubClientConfig = {
  lovableKey: string;
  githubKey: string;
};

type GithubContent = {
  type?: string;
  content?: string;
  encoding?: string;
  sha?: string;
};

type GithubPutContentResponse = {
  commit: {
    sha: string;
  };
  content?: {
    sha?: string;
  };
};

export type GithubFilePayload = {
  path: string;
  content: string;
};

export class GithubApiError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`GitHub API error ${status}: ${body.slice(0, 600)}`);
    this.name = "GithubApiError";
    this.status = status;
    this.body = body;
  }
}

export function isGithubNotFound(error: unknown) {
  return error instanceof GithubApiError && error.status === 404;
}

export function isGithubEmptyRepository(error: unknown) {
  if (!(error instanceof GithubApiError)) return false;
  return error.status === 409 && error.body.toLowerCase().includes("repository is empty");
}

export function isMissingGithubContent(error: unknown) {
  return isGithubNotFound(error) || isGithubEmptyRepository(error);
}

function isWorkflowFile(path: string) {
  return path.split("/").slice(0, 2).join("/") === ".github/workflows";
}

function isLikelyWorkflowPermissionError(error: unknown, path: string) {
  return isWorkflowFile(path) && error instanceof GithubApiError && (error.status === 404 || error.status === 403);
}

function workflowPermissionMessage(path: string) {
  return [
    `GitHub rejected ${path} because the connected token cannot create or update Actions workflow files.`,
    "Reconnect the GitHub connector with a token that has workflow access:",
    "classic PAT: repo + workflow; fine-grained PAT: this repository with Contents: Read and write and Workflows: Read and write.",
  ].join(" ");
}

export function createGithubClient({ lovableKey, githubKey }: GithubClientConfig) {
  async function request(path: string, init?: RequestInit) {
    const url = `${GATEWAY_URL}/${path.startsWith("/") ? path.slice(1) : path}`;
    const headers = new Headers(init?.headers);
    headers.set("Accept", "application/vnd.github+json");
    headers.set("Authorization", `Bearer ${lovableKey}`);
    headers.set("X-Connection-Api-Key", githubKey);
    if (init?.body && !headers.get("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, { ...init, headers });
    if (!response.ok) {
      throw new GithubApiError(response.status, await response.text());
    }
    return response;
  }

  async function json<T>(path: string, init?: RequestInit) {
    const response = await request(path, init);
    return (await response.json()) as T;
  }

  return { json, request };
}

type GithubClient = ReturnType<typeof createGithubClient>;

function encodeRepoPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function encodeRefName(ref: string) {
  return encodeURIComponent(ref);
}

function decodeContent(item: GithubContent): string {
  if (item.type === "file" && item.content && item.encoding === "base64") {
    return Buffer.from(item.content.replace(/\n/g, ""), "base64").toString("utf-8");
  }
  throw new Error("GitHub returned a non-file or unencoded item");
}

export async function fetchRepoFile(
  client: GithubClient,
  owner: string,
  repo: string,
  path: string,
  branch: string,
): Promise<{ content: string; sha: string | null }> {
  const encodedPath = encodeRepoPath(path);
  const item = await client.json<GithubContent>(
    `repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`,
  );
  return { content: decodeContent(item), sha: item.sha ?? null };
}

async function getBranchBase(client: GithubClient, owner: string, repo: string, branch: string) {
  const ref = await client.json<{ object: { sha: string } }>(
    `repos/${owner}/${repo}/git/ref/heads/${encodeRefName(branch)}`,
  );
  const parentCommitSha = ref.object.sha;
  const commit = await client.json<{ tree: { sha: string } }>(
    `repos/${owner}/${repo}/git/commits/${parentCommitSha}`,
  );
  return { parentCommitSha, baseTreeSha: commit.tree.sha };
}

async function bootstrapEmptyRepository(
  client: GithubClient,
  params: {
    owner: string;
    repo: string;
    branch: string;
    message: string;
    files: GithubFilePayload[];
  },
) {
  const [firstFile, ...remainingFiles] = params.files;
  if (!firstFile) {
    throw new Error("No files supplied for GitHub commit.");
  }

  let firstCommit: GithubPutContentResponse;
  try {
    firstCommit = await client.json<GithubPutContentResponse>(
      `repos/${params.owner}/${params.repo}/contents/${encodeRepoPath(firstFile.path)}`,
      {
        method: "PUT",
        body: JSON.stringify({
          message: params.message,
          content: Buffer.from(firstFile.content, "utf-8").toString("base64"),
        }),
      },
    );
  } catch (error) {
    if (isLikelyWorkflowPermissionError(error, firstFile.path)) {
      throw new Error(workflowPermissionMessage(firstFile.path));
    }
    throw error;
  }

  if (remainingFiles.length === 0) {
    return {
      owner: params.owner,
      repo: params.repo,
      branch: params.branch,
      commitSha: firstCommit.commit.sha,
      url: `https://github.com/${params.owner}/${params.repo}/commit/${firstCommit.commit.sha}`,
    };
  }

  return commitFilesWithContentsApi(client, params, remainingFiles, firstCommit.commit.sha);
}

async function commitFilesWithContentsApi(
  client: GithubClient,
  params: {
    owner: string;
    repo: string;
    branch: string;
    message: string;
  },
  files: GithubFilePayload[],
  priorCommitSha?: string,
) {
  let commitSha = priorCommitSha ?? "";

  for (const [idx, file] of files.entries()) {
    let sha: string | null = null;
    try {
      sha = (await fetchRepoFile(client, params.owner, params.repo, file.path, params.branch)).sha;
    } catch (error) {
      if (!isMissingGithubContent(error)) {
        throw error;
      }
    }

    let result: GithubPutContentResponse;
    try {
      result = await client.json<GithubPutContentResponse>(
        `repos/${params.owner}/${params.repo}/contents/${encodeRepoPath(file.path)}`,
        {
          method: "PUT",
          body: JSON.stringify({
            message: files.length === 1 ? params.message : `${params.message} (${idx + 1}/${files.length})`,
            content: Buffer.from(file.content, "utf-8").toString("base64"),
            branch: params.branch,
            ...(sha ? { sha } : {}),
          }),
        },
      );
    } catch (error) {
      if (isLikelyWorkflowPermissionError(error, file.path)) {
        throw new Error(workflowPermissionMessage(file.path));
      }
      throw error;
    }
    commitSha = result.commit.sha;
  }

  if (!commitSha) {
    throw new Error("No files supplied for GitHub commit.");
  }

  return {
    owner: params.owner,
    repo: params.repo,
    branch: params.branch,
    commitSha,
    url: `https://github.com/${params.owner}/${params.repo}/commit/${commitSha}`,
  };
}

async function commitFilesWithExistingBase(
  client: GithubClient,
  params: {
    owner: string;
    repo: string;
    branch: string;
    message: string;
  },
  files: GithubFilePayload[],
  base: { parentCommitSha: string; baseTreeSha: string },
) {
  const tree = await client.json<{ sha: string }>(`repos/${params.owner}/${params.repo}/git/trees`, {
    method: "POST",
    body: JSON.stringify({
      base_tree: base.baseTreeSha,
      tree: files.map((file) => ({
        path: file.path,
        mode: "100644",
        type: "blob",
        content: file.content,
      })),
    }),
  });

  const newCommit = await client.json<{ sha: string }>(`repos/${params.owner}/${params.repo}/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message: params.message, tree: tree.sha, parents: [base.parentCommitSha] }),
  });

  await client.request(`repos/${params.owner}/${params.repo}/git/refs/heads/${encodeRefName(params.branch)}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: newCommit.sha }),
  });

  return {
    owner: params.owner,
    repo: params.repo,
    branch: params.branch,
    commitSha: newCommit.sha,
    url: `https://github.com/${params.owner}/${params.repo}/commit/${newCommit.sha}`,
  };
}

export async function commitFilesToGitHub(
  client: GithubClient,
  params: {
    owner: string;
    repo: string;
    branch: string;
    message: string;
    files: GithubFilePayload[];
  },
) {
  try {
    await getBranchBase(client, params.owner, params.repo, params.branch);
  } catch (error) {
    if (!isGithubNotFound(error) && !isGithubEmptyRepository(error)) {
      throw error;
    }
    return bootstrapEmptyRepository(client, params);
  }

  return commitFilesWithContentsApi(client, params, params.files);
}