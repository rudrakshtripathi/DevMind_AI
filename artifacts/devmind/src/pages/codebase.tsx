import { useState } from "react";
import { useListCodebaseProjects, useCreateCodebaseProject, useQueryCodebase, useListCodebaseQuestions } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Plus, MessageSquare, RefreshCw, ChevronRight, FileCode, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface Source {
  file: string;
  line: number;
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
  const { mutate: queryCodebase, isPending } = useQueryCodebase(projectId, {
    mutation: {
      onSuccess: () => {
        setQuestion("");
        qc.invalidateQueries({ queryKey: [`/api/codebase/projects/${projectId}/questions`] });
      },
      onError: () => {
        toast({ title: "Query failed", variant: "destructive" });
      },
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    queryCodebase({ data: { question } });
  }

  return (
    <div className="flex flex-col h-full">
      {/* History */}
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

      {/* Input */}
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

export default function CodebasePage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState("");
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
        setFiles("");
        qc.invalidateQueries({ queryKey: ["/api/codebase/projects"] });
        toast({ title: "Project created", description: "Indexing your codebase…" });
      },
      onError: () => {
        toast({ title: "Failed to create project", variant: "destructive" });
      },
    },
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createProject({ data: { name, description: description || undefined, files: files || undefined } });
  }

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
              <Textarea
                placeholder="Paste codebase content here (files separated by comments or JSON format)"
                value={files}
                onChange={(e) => setFiles(e.target.value)}
                className="min-h-32 font-mono text-xs resize-y"
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={isPending || !name.trim()} size="sm" className="flex-1">
                  {isPending ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                  Create
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowNew(false)}>
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
