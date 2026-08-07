import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { GitBranch, Plus, Trash2, Eye, GitCommit, Loader2, FilePlus, FileEdit, Sparkles } from "lucide-react";
import { commitToGitHub, previewCommit, getRepoFile } from "@/lib/github.functions";
import { COMMITTER_PRESETS } from "@/lib/committer-presets";

export const Route = createFileRoute("/dashboard/committer")({
  component: CommitterPage,
  head: () => ({
    meta: [
      { title: "GitHub Committer · AiXin" },
      { name: "description", content: "Preview diffs and commit changes to the AiXin protocol repository." },
      { property: "og:title", content: "GitHub Committer · AiXin" },
      { property: "og:description", content: "Preview diffs and commit changes to the AiXin protocol repository." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type FileItem = { path: string; content: string };

type PreviewFile = {
  path: string;
  status: "new" | "modified" | "unchanged";
  oldContent: string | null;
  newContent: string;
  oldSha: string | null;
};

function CommitterPage() {
  const { t } = useI18n();
  const [owner, setOwner] = useState("aixin-protocol");
  const [repo, setRepo] = useState("aixin-protocol");
  const [branch, setBranch] = useState("main");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<FileItem[]>([{ path: "", content: "" }]);
  const [preview, setPreview] = useState<{ files: PreviewFile[] } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<{ url: string; commitSha: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const runPreview = useServerFn(previewCommit);
  const runCommit = useServerFn(commitToGitHub);
  const loadFile = useServerFn(getRepoFile);

  const changed = preview?.files.filter((f) => f.status !== "unchanged") ?? [];

  const applyPreset = (id: string) => {
    const p = COMMITTER_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setOwner(p.owner);
    setRepo(p.repo);
    setBranch(p.branch);
    setMessage(p.message);
    setFiles(p.files.map((f) => ({ path: f.path, content: f.content })));
    setPreview(null);
    setResult(null);
    toast.success(`Loaded preset: ${p.name}`);
  };

  const updateFile = (idx: number, field: keyof FileItem, value: string) => {
    setFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, [field]: value } : f)));
  };

  const addFile = () => setFiles((prev) => [...prev, { path: "", content: "" }]);
  const removeFile = (idx: number) =>
    setFiles((prev) => (prev.length === 1 ? [{ path: "", content: "" }] : prev.filter((_, i) => i !== idx)));

  const validFiles = files.filter((f) => f.path.trim());

  const handlePreview = async () => {
    if (!validFiles.length) return toast.error(t("commit.addFile"));
    setBusy(true);
    setResult(null);
    try {
      const res = await runPreview({ data: { owner, repo, branch, files: validFiles } });
      setPreview(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("commit.preview"));
    } finally {
      setBusy(false);
    }
  };

  const loadExisting = async (idx: number) => {
    const path = files[idx].path.trim();
    if (!path) return toast.error(t("commit.addFile"));
    try {
      const res = await loadFile({ data: { owner, repo, branch, path } });
      updateFile(idx, "content", res.content);
      toast.success(`${t("commit.load")}: ${path}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("commit.load"));
    }
  };

  const handleCommit = async () => {
    if (!changed.length) return;
    setBusy(true);
    try {
      const res = await runCommit({
        data: {
          owner,
          repo,
          branch,
          message: message.trim() || "chore: update via AiXin committer",
          files: changed.map((f) => ({ path: f.path, content: f.newContent })),
        },
      });
      setResult(res);
      setConfirmOpen(false);
      toast.success(t("commit.done"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("commit.commit"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display flex items-center gap-2 text-2xl font-semibold">
          <GitBranch className="h-5 w-5 text-primary" /> {t("commit.title")}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t("commit.sub")}</p>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <Label className="text-sm font-semibold">Presets</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Load a curated bundle of files into the form. Review the diff before committing.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Select onValueChange={applyPreset}>
              <SelectTrigger className="w-full sm:w-[420px]">
                <SelectValue placeholder="Choose a preset to load…" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Active</SelectLabel>
                  {COMMITTER_PRESETS.filter((p) => p.status === "active").length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      No active presets
                    </SelectItem>
                  ) : (
                    COMMITTER_PRESETS.filter((p) => p.status === "active").map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))
                  )}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Shipped</SelectLabel>
                  {COMMITTER_PRESETS.filter((p) => p.status === "shipped").map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>{t("commit.owner")}</Label>
              <Input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="aixin-protocol" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("commit.repo")}</Label>
              <Input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="aixin-protocol" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("commit.branch")}</Label>
              <Input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="main" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("commit.message")}</Label>
            <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="feat: ..." />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("commit.files")}</Label>
              <Button type="button" variant="outline" size="sm" onClick={addFile}>
                <Plus className="h-4 w-4" /> {t("commit.addFile")}
              </Button>
            </div>
            {files.map((file, idx) => (
              <div key={idx} className="space-y-3 rounded-lg border border-border bg-secondary/30 p-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={file.path}
                    onChange={(e) => updateFile(idx, "path", e.target.value)}
                    placeholder="server/src/anchor.mjs"
                    className="font-mono text-xs"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => loadExisting(idx)} title={t("commit.load")}>
                    <FileEdit className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(idx)}
                    disabled={files.length === 1 && !file.path && !file.content}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <Textarea
                  value={file.content}
                  onChange={(e) => updateFile(idx, "content", e.target.value)}
                  placeholder="// paste file content..."
                  className="min-h-[120px] font-mono text-xs"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handlePreview} disabled={busy} variant="secondary">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />} {t("commit.preview")}
            </Button>
            <Button
              onClick={() => {
                if (!preview || !changed.length) return toast.error(t("commit.preview"));
                setConfirmOpen(true);
              }}
              disabled={busy || !preview || !changed.length}
            >
              <GitCommit className="h-4 w-4" /> {t("commit.commit")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {preview && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="font-display flex items-center gap-2 font-semibold">
              <Eye className="h-4 w-4 text-primary" /> {t("commit.diffTitle")}
            </div>
            {changed.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("commit.noChanges")}</p>
            ) : (
              <div className="space-y-4">
                {changed.map((f) => (
                  <div key={f.path} className="overflow-hidden rounded-lg border border-border">
                    <div className="flex items-center gap-2 bg-muted px-3 py-2 font-mono text-xs">
                      {f.status === "new" ? (
                        <FilePlus className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <FileEdit className="h-3.5 w-3.5 text-warning" />
                      )}
                      {f.path}
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        {f.status}
                      </Badge>
                    </div>
                    <div className="grid divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
                      <ScrollArea className="h-48">
                        <pre className="whitespace-pre-wrap p-3 text-[11px] text-muted-foreground">
                          {f.oldContent ?? "(new file)"}
                        </pre>
                      </ScrollArea>
                      <ScrollArea className="h-48">
                        <pre className="whitespace-pre-wrap p-3 text-[11px]">{f.newContent}</pre>
                      </ScrollArea>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-success/50 bg-success/5">
          <CardContent className="space-y-2 p-5">
            <div className="font-display flex items-center gap-2 font-semibold text-success">
              <GitCommit className="h-4 w-4" /> {t("commit.done")}
            </div>
            <p className="break-all font-mono text-xs text-muted-foreground">{result.commitSha}</p>
            <Button asChild variant="outline" size="sm">
              <a href={result.url} target="_blank" rel="noreferrer">
                {t("commit.view")}
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("commit.confirmTitle")}</DialogTitle>
            <DialogDescription>{t("commit.confirmDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="font-medium">
              {owner}/{repo}@{branch}
            </div>
            <ul className="list-disc pl-5 text-muted-foreground">
              {changed.map((f) => (
                <li key={f.path}>
                  {f.status === "new" ? "Create" : "Update"} {f.path}
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t("commit.cancel")}
            </Button>
            <Button onClick={handleCommit} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCommit className="h-4 w-4" />} {t("commit.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
