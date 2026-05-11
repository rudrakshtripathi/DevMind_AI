import { useState, useRef, useCallback } from "react";
import { useListCodebaseProjects, useCreateCodebaseProject, useQueryCodebase, useListCodebaseQuestions } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Plus,
  MessageSquare,
  RefreshCw,
  ChevronRight,
  FileCode,
  AlertCircle,
  Upload,
  FolderOpen,
  Files,
  X,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface Source {
  file: string;
  line: number;
}

interface UploadedFile {
  name: string;
  path: string;
  content: string;
  size: number;
}

const IGNORED_PATTERNS = [
  /node_modules\//,
  /\.git\//,
  /dist\//,
  /build\//,
  /\.next\//,
  /\.cache\//,
  /coverage\//,
  /\.DS_Store/,
  /\.env/,
  /\.lock$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
];

const TEXT_EXTENSIONS = new Set([
  "ts", "tsx", "js", "jsx", "mjs", "cjs",
  "py", "java", "go", "rs", "rb", "php", "c", "cpp", "h", "hpp",
  "cs", "swift", "kt", "scala", "r", "lua",
  "html", "htm", "css", "scss", "sass", "less",
  "json", "yaml", "yml", "toml", "xml", "ini", "env",
  "md", "mdx", "txt", "sh", "bash", "zsh",
  "sql", "graphql", "gql",
  "vue", "svelte", "astro",
  "dockerfile", "makefile", "gitignore",
]);

function isTextFile(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return TEXT_EXTENSIONS.has(ext) || !filename.includes(".");
}

function shouldIgnore(path: string): boolean {
  return IGNORED_PATTERNS.some((p) => p.test(path));
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function buildFilesContent(uploadedFiles: UploadedFile[]): string {
  return uploadedFiles
    .map((f) => `// ===== FILE: ${f.path} =====\n${f.content}`)
    .join("\n\n");
}

function ProjectCard({
  project,
  isSelected,
  onClick,
}: {
  project: { id: number; name: string; description?: string | null; status: string; fileCount?: number | null; createdAt: Date };
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
        isSelected
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary/40 bg-card"
      }`}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <FileCode className="h-4 w-4 text-purple-400 flex-shrink-0" />
        <span className="text-sm font-medium truncate">{project.name}</span>
        {isSelected && <ChevronRight className="h-3 w-3 ml-auto text-primary" />}
      </div>
      {project.description && (
        <div className="text-xs text-muted-foreground truncate pl-6">{project.description}</div>
      )}
      <div className="text-xs text-muted-foreground pl-6 mt-0.5">
        {project.status === "indexed" ? `${project.fileCount ?? "?"} files indexed` : project.status}
      </div>
    </button>
  );
}

function QAThread({ projectId }: { projectId: number }) {
  const [question, setQuestion] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: questions, isLoading } = useListCodebaseQuestions(projectId);
  const { mutate: queryCodebase, isPending } = useQueryCodebase({
    mutation: {
      onSuccess: () => {
        setQuestion("");
        qc.invalidateQueries({ queryKey: [`/api/codebase/projects/${projectId}/questions`] });
      },
      onError: () => {
        toast({ title: "Query failed — please try again", variant: "destructive" });
      },
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    queryCodebase({ id: projectId, data: { question } });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : !questions || questions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-30" />
            Ask anything about this codebase
          </div>
        ) : (
          [...questions].reverse().map((q) => {
            const sources: Source[] = q.sources ? (JSON.parse(q.sources as string) as Source[]) : [];
            return (
              <div key={q.id} className="space-y-2">
                <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                  <div className="text-xs font-medium text-primary mb-1">Question</div>
                  <div className="text-sm">{q.question}</div>
                </div>
                <div className="bg-card border border-card-border rounded-xl px-4 py-3">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Answer</div>
                  <div className="text-sm whitespace-pre-wrap">{q.answer}</div>
                  {sources.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {sources.map((s, i) => (
                        <span
                          key={i}
                          className="text-xs bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground"
                        >
                          {s.file}:{s.line}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Ask a question about this codebase…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={isPending}
          className="flex-1"
        />
        <Button type="submit" disabled={isPending || !question.trim()} size="icon">
          {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}

type InputMode = "upload" | "paste";

function FileUploadZone({
  onFilesLoaded,
  uploadedFiles,
  onClear,
  isLoading,
}: {
  onFilesLoaded: (files: UploadedFile[], folderName?: string) => void;
  uploadedFiles: UploadedFile[];
  onClear: () => void;
  isLoading: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [showFileList, setShowFileList] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  async function readFiles(fileList: FileList, folderName?: string): Promise<void> {
    const results: UploadedFile[] = [];
    const skipped: string[] = [];

    const readPromises = Array.from(fileList).map(async (file) => {
      const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;

      if (shouldIgnore(path) || !isTextFile(file.name)) {
        skipped.push(file.name);
        return;
      }

      if (file.size > 500 * 1024) {
        skipped.push(`${file.name} (too large)`);
        return;
      }

      try {
        const content = await file.text();
        results.push({ name: file.name, path, content, size: file.size });
      } catch {
        skipped.push(file.name);
      }
    });

    await Promise.all(readPromises);
    results.sort((a, b) => a.path.localeCompare(b.path));

    if (results.length === 0) {
      toast({ title: "No readable files found", description: "Make sure you're selecting text/code files.", variant: "destructive" });
      return;
    }

    if (skipped.length > 0) {
      toast({ title: `${skipped.length} files skipped`, description: "Binary files, large files, and common build dirs are excluded." });
    }

    onFilesLoaded(results, folderName);
  }

  function handleFolderInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const firstPath = (files[0] as File & { webkitRelativePath?: string }).webkitRelativePath ?? "";
    const folderName = firstPath.split("/")[0] || undefined;
    void readFiles(files, folderName);
    e.target.value = "";
  }

  function handleFilesInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    void readFiles(files);
    e.target.value = "";
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const items = Array.from(e.dataTransfer.items);
      const results: UploadedFile[] = [];
      let folderName: string | undefined;

      async function traverseEntry(entry: FileSystemEntry, basePath = ""): Promise<void> {
        if (entry.isFile) {
          const fileEntry = entry as FileSystemFileEntry;
          await new Promise<void>((resolve) => {
            fileEntry.getFile(async (file) => {
              const path = basePath ? `${basePath}/${file.name}` : file.name;
              if (!shouldIgnore(path) && isTextFile(file.name) && file.size <= 500 * 1024) {
                try {
                  const content = await file.text();
                  results.push({ name: file.name, path, content, size: file.size });
                } catch {}
              }
              resolve();
            });
          });
        } else if (entry.isDirectory) {
          const dirEntry = entry as FileSystemDirectoryEntry;
          if (!folderName) folderName = entry.name;
          const reader = dirEntry.createReader();
          await new Promise<void>((resolve) => {
            reader.readEntries(async (entries) => {
              if (shouldIgnore(`${entry.name}/`)) { resolve(); return; }
              await Promise.all(
                entries.map((e2) =>
                  traverseEntry(e2, basePath ? `${basePath}/${entry.name}` : entry.name)
                )
              );
              resolve();
            });
          });
        }
      }

      const entries = items
        .map((item) => item.webkitGetAsEntry?.())
        .filter(Boolean) as FileSystemEntry[];

      await Promise.all(entries.map((entry) => traverseEntry(entry)));
      results.sort((a, b) => a.path.localeCompare(b.path));

      if (results.length === 0) {
        toast({ title: "No readable files found", variant: "destructive" });
        return;
      }

      onFilesLoaded(results, folderName);
    },
    [onFilesLoaded, toast]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Reading files…
      </div>
    );
  }

  if (uploadedFiles.length > 0) {
    const totalSize = uploadedFiles.reduce((s, f) => s + f.size, 0);
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between bg-green-500/10 border border-green-500/25 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <Files className="h-4 w-4 text-green-400" />
            <span className="font-medium text-green-400">{uploadedFiles.length} files loaded</span>
            <span className="text-muted-foreground text-xs">({formatBytes(totalSize)} total)</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowFileList(!showFileList)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 px-2 py-1 rounded hover:bg-muted transition-colors"
            >
              {showFileList ? "Hide" : "Show"} files
              <ChevronDown className={cn("h-3 w-3 transition-transform", showFileList && "rotate-180")} />
            </button>
            <button
              type="button"
              onClick={onClear}
              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {showFileList && (
          <div className="bg-muted/40 border border-border rounded-lg p-2 max-h-36 overflow-y-auto">
            {uploadedFiles.map((f, i) => (
              <div key={i} className="flex items-center justify-between py-0.5 px-1 text-xs">
                <span className="font-mono text-muted-foreground truncate flex-1">{f.path}</span>
                <span className="text-muted-foreground/60 ml-2 flex-shrink-0">{formatBytes(f.size)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-xl p-6 text-center transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/40 bg-muted/20"
      )}
    >
      <Upload className={cn("h-8 w-8 mx-auto mb-3 transition-colors", isDragging ? "text-primary" : "text-muted-foreground/40")} />
      <div className="text-sm font-medium mb-1">
        {isDragging ? "Drop your files here" : "Upload code files or a folder"}
      </div>
      <div className="text-xs text-muted-foreground mb-4">
        Drag & drop files or a folder, or choose below. Binary files, <code>node_modules</code>, and build dirs are excluded automatically.
      </div>
      <div className="flex gap-2 justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => folderInputRef.current?.click()}
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Select Folder
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => filesInputRef.current?.click()}
        >
          <Files className="h-3.5 w-3.5" />
          Select Files
        </Button>
      </div>

      <input
        ref={folderInputRef}
        type="file"
        multiple
        className="hidden"
        // @ts-expect-error non-standard attribute
        webkitdirectory=""
        onChange={handleFolderInput}
      />
      <input
        ref={filesInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".ts,.tsx,.js,.jsx,.mjs,.py,.java,.go,.rs,.rb,.php,.c,.cpp,.h,.cs,.swift,.kt,.html,.css,.scss,.json,.yaml,.yml,.toml,.xml,.md,.sh,.sql,.graphql,.vue,.svelte,.txt,.env,.gitignore,.dockerfile,.makefile"
        onChange={handleFilesInput}
      />
    </div>
  );
}

export default function CodebasePage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [pasteContent, setPasteContent] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: projects, isLoading } = useListCodebaseProjects();
  const { mutate: createProject, isPending } = useCreateCodebaseProject({
    mutation: {
      onSuccess: (data) => {
        setSelectedId(data.id);
        setShowNew(false);
        setName("");
        setDescription("");
        setUploadedFiles([]);
        setPasteContent("");
        qc.invalidateQueries({ queryKey: ["/api/codebase/projects"] });
        toast({ title: "Project created", description: "Indexing your codebase…" });
      },
      onError: () => {
        toast({ title: "Failed to create project", variant: "destructive" });
      },
    },
  });

  function handleFilesLoaded(files: UploadedFile[], folderName?: string) {
    setIsReadingFiles(false);
    setUploadedFiles(files);
    if (folderName && !name) setName(folderName);
    toast({ title: `${files.length} files ready`, description: "Give the project a name and click Create." });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const filesContent =
      inputMode === "upload"
        ? buildFilesContent(uploadedFiles)
        : pasteContent;

    createProject({
      data: {
        name,
        description: description || undefined,
        files: filesContent || undefined,
      },
    });
  }

  const canCreate =
    name.trim() &&
    (inputMode === "upload" ? uploadedFiles.length > 0 : pasteContent.trim().length > 0);

  const selectedProject = projects?.find((p) => p.id === selectedId);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="h-5 w-5 text-purple-400" />
          <h1 className="text-2xl font-bold">Codebase Knowledge AI</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Index a codebase and ask natural language questions. Get precise answers with file and line references.
        </p>
      </div>

      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* Project list */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3">
          <Button variant="outline" className="w-full gap-2" onClick={() => setShowNew(!showNew)}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>

          {showNew && (
            <form onSubmit={handleCreate} className="bg-card border border-card-border rounded-xl p-4 space-y-3">
              <div className="text-sm font-medium">New Codebase Project</div>

              <Input
                placeholder="Project name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {/* Mode toggle */}
              <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setInputMode("upload")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 font-medium transition-colors",
                    inputMode === "upload"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Upload className="h-3 w-3" />
                  Upload Files
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("paste")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 font-medium transition-colors",
                    inputMode === "paste"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <FileCode className="h-3 w-3" />
                  Paste Code
                </button>
              </div>

              {inputMode === "upload" ? (
                <FileUploadZone
                  onFilesLoaded={handleFilesLoaded}
                  uploadedFiles={uploadedFiles}
                  onClear={() => setUploadedFiles([])}
                  isLoading={isReadingFiles}
                />
              ) : (
                <Textarea
                  placeholder="Paste codebase content here…"
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  className="min-h-32 font-mono text-xs resize-y"
                />
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={isPending || !canCreate} size="sm" className="flex-1">
                  {isPending ? (
                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Plus className="h-3 w-3 mr-1" />
                  )}
                  Create
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowNew(false);
                    setUploadedFiles([]);
                    setPasteContent("");
                    setName("");
                    setDescription("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div className="flex-1 overflow-y-auto space-y-2">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
            ) : !projects || projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-30" />
                No projects yet
              </div>
            ) : (
              projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  isSelected={selectedId === p.id}
                  onClick={() => setSelectedId(p.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Q&A Panel */}
        <div className="flex-1 bg-card border border-card-border rounded-xl p-5 flex flex-col min-h-0">
          {selectedId ? (
            <>
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                <FileCode className="h-4 w-4 text-purple-400" />
                <span className="font-medium text-sm">{selectedProject?.name ?? "Project"}</span>
                {selectedProject?.fileCount != null && (
                  <span className="text-xs text-muted-foreground">
                    ({selectedProject.fileCount} files)
                  </span>
                )}
                {selectedProject?.status === "indexed" && (
                  <span className="text-xs text-green-400 ml-auto">● Indexed</span>
                )}
                {selectedProject?.status === "pending" && (
                  <span className="text-xs text-yellow-400 ml-auto flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" />Indexing…
                  </span>
                )}
              </div>
              <QAThread projectId={selectedId} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              <div className="text-center">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
                Select a project or create a new one to get started
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
