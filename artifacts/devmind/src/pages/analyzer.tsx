import { useState } from "react";
import { useListIncidents, useCreateIncident, useGetIncident } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, RefreshCw, AlertCircle, CheckCircle2, XCircle,
  Brain, GitBranch, Shield, Wrench, BookOpen, Activity,
  Clock, ArrowDown, Terminal, Bell, FileText, ChevronDown,
  ChevronUp, Zap, Database, Globe, Server, Layers, Radio,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface FailureTimelineEvent {
  timestamp: string;
  service: string;
  event: string;
  type: "trigger" | "failure" | "cascade" | "recovery" | "alert";
}

interface DependencyNode {
  name: string;
  type: "frontend" | "api" | "service" | "database" | "cache" | "queue" | "infra" | "external";
  status: "healthy" | "degraded" | "failed";
}

interface RemediationPlan {
  immediate: string[];
  workaround: string[];
  longTerm: string[];
  rollback: string[];
  validation: string[];
}

interface DebuggingPlaybook {
  commands: string[];
  logsToInspect: string[];
  metricsToCheck: string[];
  queries: string[];
}

interface EnhancedIncidentAnalysis {
  incidentTitle: string;
  severity: "critical" | "high" | "medium" | "low";
  riskScore: number;
  confidence: number;
  executiveSummary: string;
  rootCause: string;
  affectedComponent: string;
  incidentType: string;
  primaryFailure: string;
  secondaryFailures: string[];
  failureTimeline: FailureTimelineEvent[];
  stackTraceAnalysis: string;
  failingFunction: string;
  failingModule: string;
  dependencyChain: DependencyNode[];
  impactAnalysis: string;
  userImpact: string;
  securityImplications: string;
  remediationPlan: RemediationPlan;
  debuggingPlaybook: DebuggingPlaybook;
  preventionStrategy: string[];
  monitoringRecommendations: string[];
  aiReasoning: string;
  postmortem: string;
  detectedTechnologies: string[];
}

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const SEV = {
  critical: { color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30",    bar: "bg-red-500",    label: "Critical" },
  high:     { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", bar: "bg-orange-500", label: "High" },
  medium:   { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", bar: "bg-yellow-500", label: "Medium" },
  low:      { color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/30",  bar: "bg-green-500",  label: "Low" },
} as const;

const TIMELINE_CFG = {
  trigger:  { color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30",   icon: Zap },
  failure:  { color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30",    icon: XCircle },
  cascade:  { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: GitBranch },
  recovery: { color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/30",  icon: CheckCircle2 },
  alert:    { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: Bell },
} as const;

const DEP_CFG = {
  frontend: { icon: Globe,     color: "text-cyan-400" },
  api:      { icon: Activity,  color: "text-purple-400" },
  service:  { icon: Server,    color: "text-blue-400" },
  database: { icon: Database,  color: "text-green-400" },
  cache:    { icon: Layers,    color: "text-orange-400" },
  queue:    { icon: Radio,     color: "text-pink-400" },
  infra:    { icon: Server,    color: "text-gray-400" },
  external: { icon: Globe,     color: "text-indigo-400" },
} as const;

function scfg(s: string) {
  return SEV[s as keyof typeof SEV] ?? SEV.medium;
}

// ─── CONFIDENCE METER ────────────────────────────────────────────────────────

function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-orange-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

// ─── FAILURE TIMELINE ────────────────────────────────────────────────────────

function FailureTimeline({ events }: { events: FailureTimelineEvent[] }) {
  if (!events.length) return <EmptyState icon={Clock}>No timeline data generated.</EmptyState>;
  return (
    <div className="space-y-0">
      {events.map((e, i) => {
        const cfg = TIMELINE_CFG[e.type] ?? TIMELINE_CFG.failure;
        const Icon = cfg.icon;
        return (
          <div key={i} className="flex gap-3">
            {/* Spine */}
            <div className="flex flex-col items-center">
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border", cfg.bg, cfg.border)}>
                <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
              </div>
              {i < events.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
            </div>
            {/* Content */}
            <div className={cn("flex-1 rounded-xl border px-3 py-2 mb-2", cfg.bg, cfg.border)}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className={cn("text-xs font-mono font-bold", cfg.color)}>{e.timestamp}</span>
                <span className="text-xs font-semibold">{e.service}</span>
                <span className={cn("text-xs px-1.5 py-0.5 rounded border uppercase font-bold ml-auto", cfg.color, cfg.bg, cfg.border)}>
                  {e.type}
                </span>
              </div>
              <div className="text-sm">{e.event}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── DEPENDENCY CHAIN ────────────────────────────────────────────────────────

function DependencyChain({ nodes }: { nodes: DependencyNode[] }) {
  if (!nodes.length) return <EmptyState icon={GitBranch}>No dependency chain available.</EmptyState>;
  return (
    <div className="space-y-1">
      {nodes.map((node, i) => {
        const depCfg = DEP_CFG[node.type] ?? DEP_CFG.service;
        const Icon = depCfg.icon;
        const statusColor = node.status === "failed" ? "text-red-400 bg-red-500/10 border-red-500/30"
          : node.status === "degraded" ? "text-orange-400 bg-orange-500/10 border-orange-500/30"
          : "text-green-400 bg-green-500/10 border-green-500/30";
        return (
          <div key={i}>
            <div className="flex items-center gap-3 bg-card border border-card-border rounded-xl px-3 py-2.5">
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center bg-muted/50")}>
                <Icon className={cn("h-3.5 w-3.5", depCfg.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{node.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{node.type}</div>
              </div>
              <span className={cn("text-xs px-2 py-0.5 rounded border font-semibold capitalize", statusColor)}>
                {node.status}
              </span>
            </div>
            {i < nodes.length - 1 && (
              <div className="flex justify-center my-0.5">
                <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── REMEDIATION PLAN ────────────────────────────────────────────────────────

function RemediationPlanView({ plan }: { plan: RemediationPlan }) {
  const sections: { key: keyof RemediationPlan; label: string; color: string; icon: React.ElementType }[] = [
    { key: "immediate",   label: "Immediate Actions",   color: "text-red-400 bg-red-500/10 border-red-500/20",     icon: Zap },
    { key: "workaround",  label: "Temporary Workaround",color: "text-orange-400 bg-orange-500/10 border-orange-500/20", icon: Activity },
    { key: "longTerm",    label: "Long-term Fix",        color: "text-blue-400 bg-blue-500/10 border-blue-500/20",  icon: Shield },
    { key: "rollback",    label: "Rollback Steps",       color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: RefreshCw },
    { key: "validation",  label: "Validation Checks",    color: "text-green-400 bg-green-500/10 border-green-500/20", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-4">
      {sections.map(({ key, label, color, icon: Icon }) => {
        const items = plan[key] ?? [];
        if (!items.length) return null;
        return (
          <div key={key} className={cn("rounded-xl border p-4", color)}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className="h-4 w-4" />
              <span className="font-semibold text-sm">{label}</span>
            </div>
            <ol className="space-y-2">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className={cn("flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border", color)}>
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </div>
  );
}

// ─── DEBUG PLAYBOOK ──────────────────────────────────────────────────────────

function DebugPlaybookView({ playbook }: { playbook: DebuggingPlaybook }) {
  const sections = [
    { label: "Shell Commands", items: playbook.commands, mono: true, icon: Terminal, color: "text-cyan-400" },
    { label: "Logs to Inspect", items: playbook.logsToInspect, mono: false, icon: FileText, color: "text-purple-400" },
    { label: "Metrics to Check", items: playbook.metricsToCheck, mono: false, icon: Activity, color: "text-green-400" },
    { label: "DB Queries", items: playbook.queries, mono: true, icon: Database, color: "text-orange-400" },
  ];

  return (
    <div className="space-y-4">
      {sections.map(({ label, items, mono, icon: Icon, color }) => {
        if (!items?.length) return null;
        return (
          <div key={label}>
            <div className={cn("flex items-center gap-2 mb-2 text-xs font-semibold", color)}>
              <Icon className="h-3.5 w-3.5" />
              {label}
            </div>
            <div className="space-y-1.5">
              {items.map((item, i) => (
                <div key={i} className={cn(
                  "rounded-lg px-3 py-2 text-xs",
                  mono ? "font-mono bg-black/30 border border-border" : "bg-muted/30"
                )}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon = AlertCircle, children }: { icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="text-center py-8 text-muted-foreground text-sm">
      <Icon className="h-6 w-6 mx-auto mb-2 opacity-30" />
      {children}
    </div>
  );
}

// ─── INCIDENT CARD ────────────────────────────────────────────────────────────

type IncidentTab = "rootcause" | "timeline" | "dependency" | "remediation" | "debug" | "prevention" | "reasoning" | "postmortem";

function IncidentCard({ id }: { id: number }) {
  const [tab, setTab] = useState<IncidentTab>("rootcause");

  const { data: incident } = useGetIncident(id, {
    query: { refetchInterval: (q) => (q?.state?.data?.status === "pending" ? 2000 : false) },
  });

  if (!incident) return <Skeleton className="h-40 rounded-xl" />;

  if (incident.status === "pending") {
    return (
      <div className="bg-card border border-card-border rounded-xl p-5 flex items-center gap-3">
        <div className="relative">
          <AlertTriangle className="h-8 w-8 text-muted-foreground/30" />
          <RefreshCw className="h-3 w-3 text-primary animate-spin absolute -bottom-0.5 -right-0.5" />
        </div>
        <div>
          <div className="text-sm font-medium truncate max-w-lg">{incident.logInput.slice(0, 80)}…</div>
          <div className="text-xs text-yellow-400 mt-0.5 flex items-center gap-1">
            <RefreshCw className="h-2.5 w-2.5 animate-spin" />
            AI SRE investigating incident…
          </div>
        </div>
      </div>
    );
  }

  if (incident.status === "error") {
    return (
      <div className="bg-card border border-red-500/30 rounded-xl p-5 text-sm text-red-400 flex items-center gap-2">
        <XCircle className="h-4 w-4" /> Analysis failed. Please try again.
      </div>
    );
  }

  // Parse enhanced result from remediation field
  const analysis: EnhancedIncidentAnalysis | null = (() => {
    try {
      if (!incident.remediation) return null;
      const p = JSON.parse(incident.remediation) as Partial<EnhancedIncidentAnalysis>;
      if (!p.incidentTitle && !p.rootCause) return null;
      return {
        incidentTitle: p.incidentTitle ?? "Incident",
        severity: p.severity ?? "medium",
        riskScore: p.riskScore ?? 5,
        confidence: p.confidence ?? 0.5,
        executiveSummary: p.executiveSummary ?? "",
        rootCause: p.rootCause ?? incident.rootCause ?? "",
        affectedComponent: p.affectedComponent ?? incident.affectedComponent ?? "",
        incidentType: p.incidentType ?? "",
        primaryFailure: p.primaryFailure ?? "",
        secondaryFailures: Array.isArray(p.secondaryFailures) ? p.secondaryFailures : [],
        failureTimeline: Array.isArray(p.failureTimeline) ? p.failureTimeline : [],
        stackTraceAnalysis: p.stackTraceAnalysis ?? "",
        failingFunction: p.failingFunction ?? "",
        failingModule: p.failingModule ?? "",
        dependencyChain: Array.isArray(p.dependencyChain) ? p.dependencyChain : [],
        impactAnalysis: p.impactAnalysis ?? "",
        userImpact: p.userImpact ?? "",
        securityImplications: p.securityImplications ?? "",
        remediationPlan: p.remediationPlan ?? { immediate: [], workaround: [], longTerm: [], rollback: [], validation: [] },
        debuggingPlaybook: p.debuggingPlaybook ?? { commands: [], logsToInspect: [], metricsToCheck: [], queries: [] },
        preventionStrategy: Array.isArray(p.preventionStrategy) ? p.preventionStrategy : [],
        monitoringRecommendations: Array.isArray(p.monitoringRecommendations) ? p.monitoringRecommendations : [],
        aiReasoning: p.aiReasoning ?? "",
        postmortem: p.postmortem ?? "",
        detectedTechnologies: Array.isArray(p.detectedTechnologies) ? p.detectedTechnologies : [],
      } satisfies EnhancedIncidentAnalysis;
    } catch { return null; }
  })();

  // Legacy fallback
  if (!analysis) {
    const cfg = scfg(incident.severity ?? "medium");
    return (
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-card-border flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm flex-1 truncate">{incident.logInput.slice(0, 70)}…</span>
          {incident.severity && <span className={cn("text-xs px-2 py-0.5 rounded border font-semibold", cfg.color, cfg.bg, cfg.border)}>{cfg.label}</span>}
        </div>
        <div className="p-5 space-y-3">
          {incident.rootCause && <p className="text-sm text-muted-foreground">{incident.rootCause}</p>}
          <p className="text-xs text-muted-foreground">Legacy format. Submit a new incident for the full investigation report.</p>
        </div>
      </div>
    );
  }

  const cfg = scfg(analysis.severity);
  const confidencePct = analysis.confidence <= 1 ? Math.round(analysis.confidence * 100) : Math.round(analysis.confidence);

  const TABS: { id: IncidentTab; label: string; icon: React.ElementType }[] = [
    { id: "rootcause",   label: "Root Cause",   icon: Brain },
    { id: "timeline",    label: "Timeline",     icon: Clock },
    { id: "dependency",  label: "Dependencies", icon: GitBranch },
    { id: "remediation", label: "Remediation",  icon: Wrench },
    { id: "debug",       label: "Debug Playbook",icon: Terminal },
    { id: "prevention",  label: "Prevention",   icon: Shield },
    { id: "reasoning",   label: "AI Reasoning", icon: Brain },
    { id: "postmortem",  label: "Postmortem",   icon: FileText },
  ];

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-card-border">
        <div className="flex flex-wrap items-start gap-3 mb-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border", cfg.bg, cfg.border)}>
            <AlertTriangle className={cn("h-5 w-5", cfg.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-bold text-base">{analysis.incidentTitle}</h3>
              <span className={cn("text-xs px-2 py-0.5 rounded border font-bold uppercase", cfg.color, cfg.bg, cfg.border)}>
                {cfg.label}
              </span>
              {analysis.incidentType && (
                <Badge variant="outline" className="text-xs">{analysis.incidentType}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{analysis.executiveSummary}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-3 mb-3">
          {[
            { label: "Risk Score", value: `${analysis.riskScore.toFixed(1)}/10`, color: cfg.color },
            { label: "Affected", value: analysis.affectedComponent, color: "text-foreground" },
            { label: "Failing In", value: analysis.failingModule || "—", color: "text-muted-foreground" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-muted/40 border border-border rounded-lg px-3 py-1.5">
              <div className={cn("text-xs font-bold", color)}>{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
          {analysis.detectedTechnologies.map((t) => (
            <Badge key={t} variant="outline" className="text-xs self-center">{t}</Badge>
          ))}
        </div>

        {/* Confidence */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-20">AI Confidence</span>
          <div className="flex-1"><ConfidenceMeter value={analysis.confidence <= 1 ? analysis.confidence : analysis.confidence / 100} /></div>
          <span className="text-xs font-mono text-muted-foreground">{confidencePct}%</span>
        </div>
      </div>

      {/* Primary / Secondary failures */}
      {(analysis.primaryFailure || analysis.secondaryFailures.length > 0) && (
        <div className="px-5 py-3 border-b border-card-border grid grid-cols-1 md:grid-cols-2 gap-3">
          {analysis.primaryFailure && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
              <div className="text-xs font-bold text-red-400 mb-1 flex items-center gap-1.5">
                <Zap className="h-3 w-3" /> PRIMARY FAILURE
              </div>
              <div className="text-sm">{analysis.primaryFailure}</div>
            </div>
          )}
          {analysis.secondaryFailures.length > 0 && (
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3">
              <div className="text-xs font-bold text-orange-400 mb-1 flex items-center gap-1.5">
                <GitBranch className="h-3 w-3" /> CASCADING FAILURES
              </div>
              <ul className="space-y-1">
                {analysis.secondaryFailures.map((f, i) => (
                  <li key={i} className="text-sm flex items-start gap-1.5">
                    <ArrowDown className="h-3 w-3 text-orange-400 mt-0.5 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-card-border overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
              tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-5">
        {tab === "rootcause" && (
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1.5">Root Cause</div>
              <p className="text-sm leading-relaxed">{analysis.rootCause}</p>
            </div>
            {analysis.stackTraceAnalysis && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1.5">Stack Trace Analysis</div>
                <div className="bg-black/30 border border-border rounded-xl p-4">
                  <p className="text-sm font-mono text-muted-foreground/90 leading-relaxed whitespace-pre-wrap">{analysis.stackTraceAnalysis}</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {analysis.impactAnalysis && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Technical Impact</div>
                  <p className="text-sm">{analysis.impactAnalysis}</p>
                </div>
              )}
              {analysis.userImpact && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">User Impact</div>
                  <p className="text-sm">{analysis.userImpact}</p>
                </div>
              )}
            </div>
            {analysis.securityImplications && analysis.securityImplications !== "None detected" && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 flex items-start gap-2">
                <Shield className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-red-400 mb-0.5">Security Implications</div>
                  <p className="text-sm">{analysis.securityImplications}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "timeline" && <FailureTimeline events={analysis.failureTimeline} />}

        {tab === "dependency" && <DependencyChain nodes={analysis.dependencyChain} />}

        {tab === "remediation" && <RemediationPlanView plan={analysis.remediationPlan} />}

        {tab === "debug" && <DebugPlaybookView playbook={analysis.debuggingPlaybook} />}

        {tab === "prevention" && (
          <div className="space-y-4">
            {analysis.preventionStrategy.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2">Prevention Measures</div>
                <div className="space-y-2">
                  {analysis.preventionStrategy.map((s, i) => (
                    <div key={i} className="flex items-start gap-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-2.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {analysis.monitoringRecommendations.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5" /> Monitoring & Alerting
                </div>
                <div className="space-y-2">
                  {analysis.monitoringRecommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2.5 bg-green-500/5 border border-green-500/20 rounded-xl px-4 py-2.5">
                      <Activity className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-mono text-xs">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "reasoning" && (
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-violet-400" />
              <span className="font-semibold text-sm text-violet-400">Why the AI concluded this is the root cause</span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{analysis.aiReasoning}</p>
          </div>
        )}

        {tab === "postmortem" && (
          <div className="space-y-4">
            <div className="bg-muted/30 border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Auto-generated Postmortem</span>
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap font-mono text-muted-foreground/90">
                {analysis.postmortem}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SAMPLE LOGS ─────────────────────────────────────────────────────────────

const SAMPLES = [
  {
    label: "DB Pool Exhaustion (Java)",
    log: `ERROR 2024-01-15 14:23:01.334 [payment-service] [thread-pool-7] c.z.h.pool.HikariPool - Connection is not available, request timed out after 30000ms
java.sql.SQLException: Timeout waiting for connection from pool
  at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:213)
  at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:162)
  at com.zaxxer.hikari.HikariDataSource.getConnection(HikariDataSource.java:100)
  at com.example.payment.PaymentService.processPayment(PaymentService.java:87)
  at com.example.payment.PaymentController.pay(PaymentController.java:45)
ERROR 2024-01-15 14:23:05.001 [payment-service] Failed to process payment for order #48291
ERROR 2024-01-15 14:23:05.002 [payment-service] Active connections: 50/50, pending queue: 127
WARN  2024-01-15 14:22:58.000 [payment-service] Slow query detected: SELECT * FROM transactions WHERE user_id=? took 28450ms`,
  },
  {
    label: "OOM / Heap Crash (JVM)",
    log: `WARN  2024-01-15 10:15:22.456 [api-gateway] Memory usage: 87% (3548MB / 4096MB)
WARN  2024-01-15 10:15:30.001 [api-gateway] Memory usage: 94% (3852MB / 4096MB)
ERROR 2024-01-15 10:15:45.889 [api-gateway] java.lang.OutOfMemoryError: Java heap space
  at java.util.Arrays.copyOf(Arrays.java:3210)
  at java.util.ArrayList.grow(ArrayList.java:265)
  at com.example.gateway.ResponseCacheService.cacheResponse(ResponseCacheService.java:142)
  at com.example.gateway.RequestHandler.handle(RequestHandler.java:78)
  at io.netty.handler.codec.http.HttpObjectAggregator.handleOversizedMessage(HttpObjectAggregator.java:165)
ERROR 2024-01-15 10:15:46.001 [api-gateway] JVM crashed. Exit code: 137
ERROR 2024-01-15 10:15:46.002 [nginx] upstream connect error: connection refused (api-gateway:8080)`,
  },
  {
    label: "Auth Middleware Crash (Node.js)",
    log: `TypeError: Cannot read properties of undefined (reading 'user')
    at AuthMiddleware.verify (/app/middleware/auth.js:23:18)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at next (/app/node_modules/express/lib/router/route.js:144:13)
    at Route.dispatch (/app/node_modules/express/lib/router/route.js:114:3)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)

[2024-01-15 09:41:02] WARN: Redis connection failed: ECONNREFUSED 127.0.0.1:6379
[2024-01-15 09:41:02] ERROR: Session store unavailable — falling back to null
[2024-01-15 09:41:03] ERROR: 500 POST /api/orders — Authentication failed: req.session is null
[2024-01-15 09:41:03] ERROR: 500 GET /api/profile — Cannot read properties of undefined`,
  },
];

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function AnalyzerPage() {
  const [logInput, setLogInput] = useState("");
  const [submittedIds, setSubmittedIds] = useState<number[]>([]);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: incidents, isLoading } = useListIncidents();
  const { mutate: createIncident, isPending } = useCreateIncident({
    mutation: {
      onSuccess: (data) => {
        setSubmittedIds((ids) => [data.id, ...ids]);
        setLogInput("");
        qc.invalidateQueries({ queryKey: ["/api/analyzer/incidents"] });
        toast({ title: "Incident submitted", description: "AI SRE is investigating the failure…" });
      },
      onError: () => toast({ title: "Failed to submit", variant: "destructive" }),
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!logInput.trim()) return;
    createIncident({ data: { logInput } });
  }

  const allIds = [
    ...submittedIds,
    ...(incidents ?? []).map((i) => i.id).filter((id) => !submittedIds.includes(id)),
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="h-5 w-5 text-orange-400" />
          <h1 className="text-2xl font-bold">Root Cause Analyzer</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          AI SRE investigates logs and stack traces — root cause, failure timeline, dependency chain, debugging playbook, and auto-generated postmortem.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-xl p-5 mb-6 space-y-4">
        <Textarea
          placeholder="Paste error logs, stack traces, Kubernetes events, or system metrics…"
          value={logInput}
          onChange={(e) => setLogInput(e.target.value)}
          className="font-mono text-xs min-h-48 resize-y"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Load sample:</span>
            {SAMPLES.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setLogInput(s.log)}
                className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
          <Button type="submit" disabled={isPending || !logInput.trim()}>
            {isPending
              ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Investigating…</>
              : <><AlertTriangle className="h-4 w-4 mr-2" />Investigate Incident</>
            }
          </Button>
        </div>
      </form>

      <div className="space-y-6">
        {isLoading && allIds.length === 0
          ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
          : allIds.length === 0
          ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
              No incidents yet. Paste logs or load a sample above.
            </div>
          )
          : allIds.map((id) => <IncidentCard key={id} id={id} />)
        }
      </div>
    </div>
  );
}
