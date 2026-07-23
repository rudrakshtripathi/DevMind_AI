import { useState } from "react";
import { useListWorkflows, useCreateWorkflow, useGetWorkflow } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Workflow,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Database,
  Globe,
  Brain,
  GitBranch,
  Clock,
  RotateCcw,
  Users,
  Play,
  Shield,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  XCircle,
  SkipForward,
  Activity,
  Lock,
  TrendingUp,
  List,
  FlaskConical,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

// ─── TYPES ──────────────────────────────────────────────────────────────────

type NodeType =
  | "trigger" | "action" | "ai" | "decision" | "database"
  | "webhook" | "parallel" | "delay" | "retry" | "human_approval";

interface DetailedStep {
  id: string;
  stepNumber: number;
  name: string;
  type: NodeType;
  service: string;
  trigger?: string;
  action: string;
  inputData: string;
  outputData: string;
  dependencies: string[];
  estimatedTime: string;
  failurePossibilities: string[];
  retryStrategy: string;
  securityRisk?: string;
  condition?: string;
}

interface DataFlowItem { from: string; to: string; dataLabel: string; payload: string; }
interface ConditionalLogic { id: string; condition: string; truePath: string; falsePath: string; type: string; }
interface ErrorScenario { step: string; scenario: string; retryCount: number; retryDelay: string; fallback: string; escalation: string; }
interface SecurityFinding { type: string; severity: "critical" | "high" | "medium" | "low"; description: string; recommendation: string; }
interface SimulationStep { stepId: string; name: string; status: "success" | "failure" | "skipped"; mockInput: string; mockOutput: string; duration: string; notes: string; }
interface DiagramNode { id: string; label: string; service: string; type: NodeType; action: string; condition?: string; }
interface DiagramEdge { from: string; to: string; label?: string; type?: "success" | "failure" | "condition" | "default"; }

interface EnhancedWorkflow {
  title: string;
  summary: string;
  businessPurpose: string;
  complexityScore: number;
  estimatedTotalTime: string;
  steps: DetailedStep[];
  conditions: ConditionalLogic[];
  dataFlow: DataFlowItem[];
  errorHandling: ErrorScenario[];
  securityFindings: SecurityFinding[];
  securitySeverityScore: number;
  aiReasoning: string;
  optimizationSuggestions: string[];
  diagram: { nodes: DiagramNode[]; edges: DiagramEdge[] };
  simulationSteps: SimulationStep[];
}

// ─── NODE CONFIG ─────────────────────────────────────────────────────────────

const NODE_CONFIG: Record<NodeType, { icon: React.ElementType; color: string; bg: string; border: string; label: string }> = {
  trigger:       { icon: Zap,        color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/40",   label: "Trigger" },
  action:        { icon: Activity,   color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/40", label: "Action" },
  ai:            { icon: Brain,      color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/40", label: "AI" },
  decision:      { icon: GitBranch,  color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/40",  label: "Decision" },
  database:      { icon: Database,   color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/40",  label: "Database" },
  webhook:       { icon: Globe,      color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/40", label: "Webhook" },
  parallel:      { icon: Play,       color: "text-teal-400",   bg: "bg-teal-500/10",   border: "border-teal-500/40",   label: "Parallel" },
  delay:         { icon: Clock,      color: "text-gray-400",   bg: "bg-gray-500/10",   border: "border-gray-500/40",   label: "Delay" },
  retry:         { icon: RotateCcw,  color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/40",    label: "Retry" },
  human_approval:{ icon: Users,      color: "text-pink-400",   bg: "bg-pink-500/10",   border: "border-pink-500/40",   label: "Approval" },
};

const SEVERITY_CONFIG = {
  critical: "text-red-400 bg-red-500/10 border-red-500/30",
  high:     "text-orange-400 bg-orange-500/10 border-orange-500/30",
  medium:   "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  low:      "text-green-400 bg-green-500/10 border-green-500/30",
};

// ─── DIAGRAM ─────────────────────────────────────────────────────────────────

function DiagramView({ nodes, edges }: { nodes: DiagramNode[]; edges: DiagramEdge[] }) {
  const edgeMap = new Map<string, DiagramEdge[]>();
  edges.forEach((e) => {
    const arr = edgeMap.get(e.from) ?? [];
    arr.push(e);
    edgeMap.set(e.from, arr);
  });

  const edgeTypeColor = (t?: string) =>
    t === "failure" ? "text-red-400" : t === "condition" ? "text-amber-400" : "text-muted-foreground";

  return (
    <div className="overflow-x-auto pb-3">
      <div className="flex items-start gap-0 min-w-max">
        {nodes.map((node, i) => {
          const cfg = NODE_CONFIG[node.type] ?? NODE_CONFIG.action;
          const Icon = cfg.icon;
          const outEdges = edgeMap.get(node.id) ?? [];
          return (
            <div key={node.id} className="flex items-center gap-0">
              {/* Node */}
              <div className={cn("rounded-xl border px-4 py-3 min-w-36 max-w-48 text-center", cfg.bg, cfg.border)}>
                <div className={cn("flex items-center justify-center gap-1.5 mb-1", cfg.color)}>
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold uppercase tracking-wide">{cfg.label}</span>
                </div>
                <div className="text-xs font-medium text-foreground leading-tight">{node.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">{node.service}</div>
                {node.condition && (
                  <div className="text-xs text-amber-400 mt-1 truncate border-t border-amber-500/20 pt-1">
                    IF {node.condition}
                  </div>
                )}
              </div>

              {/* Arrow(s) */}
              {i < nodes.length - 1 && (
                <div className="flex flex-col items-center mx-1">
                  {outEdges.length > 0 ? (
                    outEdges.map((e, ei) => (
                      <div key={ei} className={cn("flex items-center gap-0.5 text-xs", edgeTypeColor(e.type))}>
                        <ArrowRight className="h-4 w-4" />
                        {e.label && <span className="text-xs opacity-70">{e.label}</span>}
                      </div>
                    ))
                  ) : (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── STEP CARD ────────────────────────────────────────────────────────────────

function StepCard({ step }: { step: DetailedStep }) {
  const [open, setOpen] = useState(false);
  const cfg = NODE_CONFIG[step.type] ?? NODE_CONFIG.action;
  const Icon = cfg.icon;

  return (
    <div className={cn("rounded-xl border overflow-hidden transition-all", cfg.border, cfg.bg)}>
      <button
        className="w-full px-4 py-3 flex items-center gap-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", cfg.bg, cfg.border, "border")}>
          <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">#{step.stepNumber}</span>
            <span className="text-sm font-semibold truncate">{step.name}</span>
            <span className={cn("text-xs px-1.5 py-0.5 rounded border font-medium ml-auto flex-shrink-0", cfg.color, cfg.bg, cfg.border)}>
              {cfg.label}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
            <span>{step.service}</span>
            <span>·</span>
            <span>{step.estimatedTime}</span>
            {step.condition && <span className="text-amber-400">· Conditional</span>}
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/30">
          <div className="grid grid-cols-2 gap-3 pt-3">
            <InfoBlock label="Action" value={step.action} />
            <InfoBlock label="Estimated Time" value={step.estimatedTime} />
            <InfoBlock label="Input Data" value={step.inputData} mono />
            <InfoBlock label="Output Data" value={step.outputData} mono />
            {step.trigger && <InfoBlock label="Trigger" value={step.trigger} />}
            {step.condition && <InfoBlock label="Condition" value={step.condition} mono />}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1.5">Failure Scenarios</div>
              <ul className="space-y-1">
                {step.failurePossibilities.map((f, i) => (
                  <li key={i} className="text-xs flex items-start gap-1.5">
                    <XCircle className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1.5">Retry Strategy</div>
              <div className="text-xs flex items-start gap-1.5">
                <RotateCcw className="h-3 w-3 text-orange-400 mt-0.5 flex-shrink-0" />
                {step.retryStrategy}
              </div>
            </div>
          </div>

          {step.securityRisk && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2 flex items-start gap-2">
              <Lock className="h-3.5 w-3.5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-red-400">Security Risk: </span>
                <span className="text-red-300/80">{step.securityRisk}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoBlock({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground mb-0.5">{label}</div>
      <div className={cn("text-xs", mono && "font-mono text-primary/80")}>{value}</div>
    </div>
  );
}

// ─── SIMULATION ───────────────────────────────────────────────────────────────

function SimulationView({ steps }: { steps: SimulationStep[] }) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {steps.map((s, i) => {
        const isOpen = active === i;
        const icon = s.status === "success"
          ? <CheckCircle2 className="h-4 w-4 text-green-400" />
          : s.status === "failure"
          ? <XCircle className="h-4 w-4 text-red-400" />
          : <SkipForward className="h-4 w-4 text-gray-400" />;

        return (
          <div key={i} className="bg-card border border-card-border rounded-xl overflow-hidden">
            <button
              className="w-full px-4 py-3 flex items-center gap-3 text-left"
              onClick={() => setActive(isOpen ? null : i)}
            >
              {icon}
              <span className="text-sm font-medium flex-1">{s.name}</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded border font-mono",
                s.status === "success" ? "text-green-400 bg-green-500/10 border-green-500/30"
                : s.status === "failure" ? "text-red-400 bg-red-500/10 border-red-500/30"
                : "text-gray-400 bg-gray-500/10 border-gray-500/30"
              )}>
                {s.duration}
              </span>
              {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {isOpen && (
              <div className="px-4 pb-4 space-y-3 border-t border-border">
                <div className="pt-3 text-xs text-muted-foreground">{s.notes}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Mock Input</div>
                    <pre className="text-xs font-mono bg-muted/50 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap">{s.mockInput}</pre>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Mock Output</div>
                    <pre className="text-xs font-mono bg-muted/50 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap">{s.mockOutput}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── WORKFLOW DETAIL ─────────────────────────────────────────────────────────

type Tab = "steps" | "logic" | "dataflow" | "errors" | "security" | "reasoning" | "simulate";

function WorkflowDetail({ id }: { id: number }) {
  const [tab, setTab] = useState<Tab>("steps");

  const { data: workflow } = useGetWorkflow(id, {
    query: { refetchInterval: (q) => (q?.state?.data?.status === "pending" ? 2000 : false) },
  });

  if (!workflow) return <Skeleton className="h-40 rounded-xl" />;

  if (workflow.status === "pending") {
    return (
      <div className="bg-card border border-card-border rounded-xl p-6 flex items-center gap-3 text-sm text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin text-primary" />
        <span>AI is designing your production-grade workflow…</span>
      </div>
    );
  }

  if (workflow.status === "error") {
    return (
      <div className="bg-card border border-red-500/30 rounded-xl p-5 text-sm text-red-400">
        Workflow generation failed. Please try again.
      </div>
    );
  }

  const wf: EnhancedWorkflow | null = (() => {
    try {
      if (!workflow.pipelineJson) return null;
      const parsed = JSON.parse(workflow.pipelineJson) as Partial<EnhancedWorkflow> | unknown[];
      // Handle old format (plain array of steps)
      if (Array.isArray(parsed)) return null;
      const p = parsed as Partial<EnhancedWorkflow>;
      // Must have the new shape — at minimum a title or summary
      if (!p.title && !p.summary && !p.steps) return null;
      return {
        title: p.title ?? workflow.description ?? "",
        summary: p.summary ?? "",
        businessPurpose: p.businessPurpose ?? "",
        complexityScore: p.complexityScore ?? 1,
        estimatedTotalTime: p.estimatedTotalTime ?? "unknown",
        steps: Array.isArray(p.steps) ? p.steps : [],
        conditions: Array.isArray(p.conditions) ? p.conditions : [],
        dataFlow: Array.isArray(p.dataFlow) ? p.dataFlow : [],
        errorHandling: Array.isArray(p.errorHandling) ? p.errorHandling : [],
        securityFindings: Array.isArray(p.securityFindings) ? p.securityFindings : [],
        securitySeverityScore: p.securitySeverityScore ?? 0,
        aiReasoning: p.aiReasoning ?? "",
        optimizationSuggestions: Array.isArray(p.optimizationSuggestions) ? p.optimizationSuggestions : [],
        diagram: p.diagram ?? { nodes: [], edges: [] },
        simulationSteps: Array.isArray(p.simulationSteps) ? p.simulationSteps : [],
      } satisfies EnhancedWorkflow;
    } catch { return null; }
  })();

  if (!wf) {
    return (
      <div className="bg-card border border-card-border rounded-xl p-5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 mb-1">
          <Workflow className="h-4 w-4 text-primary" />
          <span className="font-medium">{workflow.description}</span>
        </div>
        <p className="text-xs">This workflow was generated before the enhanced format was available. Submit a new workflow to see the full production-grade breakdown.</p>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "steps",     label: "Steps",      icon: List },
    { id: "logic",     label: "Logic",      icon: GitBranch },
    { id: "dataflow",  label: "Data Flow",  icon: ArrowRight },
    { id: "errors",    label: "Resilience", icon: RotateCcw },
    { id: "security",  label: "Security",   icon: Shield },
    { id: "reasoning", label: "AI Reasoning", icon: Brain },
    { id: "simulate",  label: "Simulate",   icon: FlaskConical },
  ];

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-card-border">
        <div className="flex items-start gap-3 mb-3">
          <Workflow className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base">{wf.title || workflow.description}</h3>
            <p className="text-sm text-muted-foreground mt-1">{wf.summary}</p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Steps", value: wf.steps.length, color: "text-primary" },
            { label: "Complexity", value: `${wf.complexityScore}/10`, color: wf.complexityScore >= 7 ? "text-orange-400" : wf.complexityScore >= 4 ? "text-yellow-400" : "text-green-400" },
            { label: "Est. Time", value: wf.estimatedTotalTime, color: "text-blue-400" },
            { label: "Security Score", value: `${wf.securitySeverityScore}/10`, color: wf.securitySeverityScore >= 7 ? "text-red-400" : wf.securitySeverityScore >= 4 ? "text-orange-400" : "text-green-400" },
            { label: "Conditions", value: wf.conditions.length, color: "text-amber-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-muted/40 border border-border rounded-lg px-3 py-1.5 text-center">
              <div className={cn("text-sm font-bold", color)}>{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
          {wf.optimizationSuggestions.length > 0 && (
            <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg px-3 py-1.5 text-center">
              <div className="text-sm font-bold text-violet-400">{wf.optimizationSuggestions.length}</div>
              <div className="text-xs text-muted-foreground">Optimizations</div>
            </div>
          )}
        </div>
      </div>

      {/* Visual Diagram */}
      {wf.diagram.nodes.length > 0 && (
        <div className="px-5 py-4 border-b border-card-border">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pipeline Diagram</div>
          <DiagramView nodes={wf.diagram.nodes} edges={wf.diagram.edges} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-card-border overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
              tab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-5">
        {tab === "steps" && (
          <div className="space-y-3">
            {wf.steps.length === 0
              ? <EmptyState>No steps generated.</EmptyState>
              : wf.steps.map((s) => <StepCard key={s.id} step={s} />)
            }
          </div>
        )}

        {tab === "logic" && (
          <div className="space-y-3">
            {wf.conditions.length === 0
              ? <EmptyState>No conditional logic detected.</EmptyState>
              : wf.conditions.map((c) => (
                <div key={c.id} className="bg-amber-500/5 border border-amber-500/25 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <GitBranch className="h-4 w-4 text-amber-400" />
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded border font-semibold",
                      "text-amber-400 bg-amber-500/10 border-amber-500/30"
                    )}>{c.type.replace("_", " ").toUpperCase()}</span>
                  </div>
                  <div className="text-sm font-mono mb-3">{c.condition}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400 mt-0.5" />
                      <div>
                        <div className="text-xs text-muted-foreground">True path</div>
                        <div className="text-xs font-medium">{c.truePath}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <XCircle className="h-3.5 w-3.5 text-red-400 mt-0.5" />
                      <div>
                        <div className="text-xs text-muted-foreground">False path</div>
                        <div className="text-xs font-medium">{c.falsePath}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {tab === "dataflow" && (
          <div className="space-y-3">
            {wf.dataFlow.length === 0
              ? <EmptyState>No data flow information generated.</EmptyState>
              : wf.dataFlow.map((d, i) => (
                <div key={i} className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-blue-300">{d.from}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-blue-300">{d.to}</span>
                    <Badge variant="outline" className="ml-auto text-xs">{d.dataLabel}</Badge>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Payload structure</div>
                    <pre className="text-xs font-mono bg-muted/40 rounded-lg px-3 py-2 overflow-x-auto">{d.payload}</pre>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {tab === "errors" && (
          <div className="space-y-4">
            {wf.errorHandling.length === 0
              ? <EmptyState>No error handling information generated.</EmptyState>
              : wf.errorHandling.map((e, i) => (
                <div key={i} className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="font-semibold text-sm">{e.step}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{e.scenario}</div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <InfoBlock label="Retry Count" value={String(e.retryCount)} />
                    <InfoBlock label="Retry Delay" value={e.retryDelay} />
                    <InfoBlock label="Fallback Action" value={e.fallback} />
                    <InfoBlock label="Escalation" value={e.escalation} />
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {tab === "security" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn(
                "text-2xl font-bold",
                wf.securitySeverityScore >= 7 ? "text-red-400"
                : wf.securitySeverityScore >= 4 ? "text-orange-400"
                : "text-green-400"
              )}>
                {wf.securitySeverityScore}/10
              </div>
              <div>
                <div className="text-sm font-semibold">Security Risk Score</div>
                <div className="text-xs text-muted-foreground">{wf.securityFindings.length} finding{wf.securityFindings.length !== 1 ? "s" : ""} detected</div>
              </div>
            </div>

            {wf.securityFindings.length === 0
              ? <EmptyState>No security issues detected.</EmptyState>
              : wf.securityFindings.map((f, i) => (
                <div key={i} className={cn("rounded-xl border p-4 space-y-2", SEVERITY_CONFIG[f.severity])}>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span className="font-semibold text-sm">{f.type}</span>
                    <span className={cn("text-xs px-1.5 py-0.5 rounded border ml-auto font-bold uppercase", SEVERITY_CONFIG[f.severity])}>
                      {f.severity}
                    </span>
                  </div>
                  <p className="text-sm">{f.description}</p>
                  <div className="border-t border-current/20 pt-2">
                    <div className="text-xs font-semibold mb-0.5">Recommendation</div>
                    <div className="text-xs">{f.recommendation}</div>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {tab === "reasoning" && (
          <div className="space-y-5">
            <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-violet-400" />
                <span className="font-semibold text-sm text-violet-400">Why this workflow was designed this way</span>
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{wf.aiReasoning}</div>
            </div>

            {wf.optimizationSuggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="font-semibold text-sm">Optimization Suggestions</span>
                </div>
                <div className="space-y-2">
                  {wf.optimizationSuggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 bg-green-500/5 border border-green-500/20 rounded-lg px-3 py-2">
                      <Lightbulb className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {wf.businessPurpose && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                <div className="text-xs font-semibold text-blue-400 mb-1">Business Purpose</div>
                <div className="text-sm text-muted-foreground">{wf.businessPurpose}</div>
              </div>
            )}
          </div>
        )}

        {tab === "simulate" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
              <FlaskConical className="h-4 w-4 text-primary" />
              Mock execution trace with simulated API payloads and responses
            </div>
            {wf.simulationSteps.length === 0
              ? <EmptyState>No simulation data generated.</EmptyState>
              : <SimulationView steps={wf.simulationSteps} />
            }
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center py-8 text-muted-foreground text-sm">
      <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-30" />
      {children}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const PLACEHOLDERS = [
  "When a GitHub PR is merged to main, run security scan, post Slack notification, update Jira ticket, and deploy to staging",
  "Every Monday at 9am, generate a weekly engineering report from Jira, summarize with AI, and email it to leadership",
  "When a customer submits a support ticket, classify its urgency with AI, route to the right team in Slack, and log it in Notion",
];

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
        qc.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        qc.invalidateQueries({ queryKey: ["/api/dashboard/recent"] });
        toast({ title: "Workflow submitted", description: "AI architect is designing your production workflow…" });
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Workflow className="h-5 w-5 text-blue-400" />
          <h1 className="text-2xl font-bold">AI Workflow Builder</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Describe any automation. AI generates a production-grade workflow with step details, error handling, security analysis, data flow, and execution simulation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-xl p-5 mb-6 space-y-4">
        <Textarea
          placeholder={`Describe your automation workflow in plain English…\n\nExample: "${PLACEHOLDERS[0]}"`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-28 resize-y"
        />
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {PLACEHOLDERS.map((p, i) => (
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
          <Button type="submit" disabled={isPending || !description.trim()}>
            {isPending ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Building…</>
            ) : (
              <><Workflow className="h-4 w-4 mr-2" />Build Workflow</>
            )}
          </Button>
        </div>
      </form>

      <div className="space-y-6">
        {isLoading && allIds.length === 0 ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))
        ) : allIds.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <AlertCircle className="h-8 w-8 mx-auto mb-3 opacity-30" />
            No workflows yet. Describe an automation above to get started.
          </div>
        ) : (
          allIds.map((id) => <WorkflowDetail key={id} id={id} />)
        )}
      </div>
    </div>
  );
}
