import { createFileRoute } from "@tanstack/react-router";
import roadmap from "../../../../ROADMAP.md?raw";

export const Route = createFileRoute("/api/public/mirror-roadmap")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const provided = request.headers.get("x-mirror-secret");
        if (!secret || provided !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }

        const lovableKey = process.env.LOVABLE_API_KEY;
        const githubKey = process.env.GITHUB_API_KEY;
        if (!lovableKey || !githubKey) {
          return Response.json({ error: "GitHub connector not configured" }, { status: 500 });
        }

        const { createGithubClient, commitFilesToGitHub } = await import("@/lib/github.server");
        const client = createGithubClient({ lovableKey, githubKey });

        try {
          const result = await commitFilesToGitHub(client, {
            owner: "aixin-protocol",
            repo: "aixin-protocol",
            branch: "main",
            message: "docs(roadmap): mirror canonical ROADMAP.md from aixin-twin",
            files: [{ path: "ROADMAP.md", content: roadmap }],
          });
          return Response.json(result);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`mirror-roadmap failed: ${message}`);
          return Response.json({ error: message }, { status: 502 });
        }
      },
    },
  },
});
