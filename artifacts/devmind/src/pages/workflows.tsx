import { useState } from "react";
import { useListWorkflows, useCreateWorkflow, useGetWorkflow } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Workflow, RefreshCw, ArrowRight, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface PipelineStep {
  id: string;
  name: string;
  service: string;
  action: string;
  trigger?: string;
  condition?: string;
}

interface DiagramNode {
  id: string;
  label: string;
  service: string;
  action: string;
}

interface DiagramEdge {
  from: string;
  to: string;
}

const SERVICE_ICONS: Record<string, string> = {
  GitHub: "🐙",
  Slack: "💬",
  Notion: "📝",
  JIRA: "🎯",
  Email: "📧",
  Scheduler: "⏰",
  AI: "🤖",
  Default: "⚡",
};

function ServiceIcon({ service }: { service: string }) {
  const icon = SERVICE_ICONS[service] ?? SERVICE_ICONS["Default"];
  return <span className="text-lg">{icon}</span>;
}

function WorkflowDiagram({ nodes, edges }: { nodes: DiagramNode[]; edges: DiagramEdge[] }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-center gap-2 min-w-max">
        {nodes.map((node, i) => {
          const hasEdge = edges.some((e) => e.from === node.id);
          return (
            <div key={node.id} className="flex items-center gap-2">
              <div className="bg-muted border border-border rounded-xl px-4 py-3 text-center min-w-32 max-w-44">
                <ServiceIcon service={node.service} />
                <div className="text-xs font-semibold mt-1 text-foreground leading-tight">{node.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{node.action}</div>
              </div>
              {hasEdge && <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WorkflowResult({ id }: { id: number }) {
  const { data: workflow } = useGetWorkflow(id, {
    query: { refetchInterval: (data) => (data?.state?.data?.status === "pending" ? 2000 : false) },
  });

  if (!workflow) return <Skeleton className="h-40 rounded-xl" />;

  const steps: PipelineStep[] = workflow.pipelineJson
    ? (JSON.parse(workflow.pipelineJson) as PipelineStep[])
    : [];
  const diagram = workflow.diagramJson
    ? (JSON.parse(workflow.diagramJson) as { nodes: DiagramNode[]; edges: DiagramEdge[] })
    : { nodes: [], edges: [] };

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-card-border flex items-center gap-3">
        <Workflow className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm flex-1 truncate">{workflow.description}</span>
        {workflow.status === "pending" && (
          <span className="flex items-center gap-1.5 text-xs text-yellow-400">
            <RefreshCw className="h-3 w-3 animate-spin" />Generating…
          </span>
        )}
        {workflow.status === "complete" && (
          <span className="text-xs text-green-400 font-medium">{steps.length} steps</span>
        )}
        {workflow.status === "error" && (
          <span className="text-xs text-red-400">Generation failed</span>
        )}
      </div>

      {workflow.status === "complete" && (
        <div className="p-5 space-y-4">
          {/* Visual diagram */}
          {diagram.nodes.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-3">Pipeline Diagram</div>
              <WorkflowDiagram nodes={diagram.nodes} edges={diagram.edges} />
            </div>
          )}

          {/* Step list */}
          {steps.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">Steps</div>
              <div className="space-y-1.5">
                {steps.map((step, i) => (
                  <div key={step.id} className="flex items-start gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div>
                      <span className="font-medium">{step.name}</span>
                      <span className="text-muted-foreground"> — {step.service}: {step.action}</span>
                      {step.trigger && (
                        <div className="text-xs text-muted-foreground">Trigger: {step.trigger}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorkflowsPage() {
  const [description, setDescription] = useState("");
  const [submittedIds, setSubmittedIds] = useState<number[]>([]);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: workflows, isLoading } = useListWorkflows();

  const { mutate: createWorkflow, isPending } = useCreateWorkflow({
    mutation: {
      onSuccess: (data) => {
        setSubmittedIds((ids) => [data.id, ...ids]);
        setDescription("");
        qc.invalidateQueries({ queryKey: ["/api/workflows"] });
        toast({ title: "Workflow submitted", description: "AI is building your pipeline…" });
      },
      onError: () => {
        toast({ title: "Failed to create workflow", variant: "destructive" });
      },
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    createWorkflow({ data: { description } });
  }

  const allIds = [
    ...submittedIds,
    ...(workflows ?? []).map((w) => w.id).filter((id) => !submittedIds.includes(id)),
  ];

  const placeholders = [
    "When a GitHub PR is merged, post a Slack notification and update the Notion changelog",
    "Every Monday at 9am, fetch new JIRA tickets and email a digest to the team",
    "When a new user signs up, add them to Mailchimp and send a Slack alert to #sales",
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Workflow className="h-5 w-5 text-blue-400" />
          <h1 className="text-2xl font-bold">AI Workflow Builder</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Describe an automation in plain English. AI converts it into a visual pipeline connecting your tools.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-xl p-5 mb-6 space-y-4">
        <div>
          <Textarea
            placeholder={`Describe your automation workflow…\n\nExample: "${placeholders[0]}"`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-28 resize-y"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {placeholders.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setDescription(p)}
              className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              Example {i + 1}
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending || !description.trim()}>
            {isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Building…
              </>
            ) : (
              <>
                <Workflow className="h-4 w-4 mr-2" />
                Build Workflow
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="space-y-4">
        {isLoading && allIds.length === 0 ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))
        ) : allIds.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <AlertCircle className="h-8 w-8 mx-auto mb-3 opacity-30" />
            No workflows yet. Describe an automation above.
          </div>
        ) : (
          allIds.map((id) => <WorkflowResult key={id} id={id} />)
        )}
      </div>
    </div>
  );
}
