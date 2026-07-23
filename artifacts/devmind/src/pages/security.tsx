import { useState } from "react";
import { useListSecurityScans, useCreateSecurityScan, useGetSecurityScan } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Shield, ChevronDown, ChevronUp, RefreshCw, AlertCircle,
  Bug, Zap, Eye, Wrench, Code2, GitBranch, Brain,
  ArrowDown, CheckCircle2, XCircle, Lock, Target,
  AlertTriangle, TrendingUp, FileCode2, Layers, List,
  BookOpen, FlaskConical,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface TaintFlowStep { label: string; detail: string; }

interface EnhancedVulnerability {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  riskScore: number;
  confidence: number;
  lineStart: number;
  lineEnd?: number;
  rootCause: string;
  description: string;
  attackScenario: string;
  exploitPayload: string;
  impactAnalysis: string;
  owaspCategory: string;
  cweId: string;
  cweName: string;
  remediationSteps: string[];
  vulnerableCode: string;
  secureCode: string;
  taintFlow: TaintFlowStep[];
  aiReasoning: string;
  bestPractices: string[];
}

interface ChainedVulnerability {
  title: string;
  steps: string[];
  severity: "critical" | "high" | "medium" | "low";
}

interface EnhancedSecurityResult {
  appSecurityScore: number;
  riskPosture: "critical" | "high" | "medium" | "low" | "secure";
  severityBreakdown: { critical: number; high: number; medium: number; low: number; info: number };
  executiveSummary: string;
  overallSummary: string;
  vulnerabilities: EnhancedVulnerability[];
  chainedVulnerabilities: ChainedVulnerability[];
  securityArchitectureInsights: string[];
  topPriorities: string[];
  detectedFrameworks: string[];
}

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const SEVERITY_CFG = {
  critical: { label: "Critical", color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30",    bar: "bg-red-500" },
  high:     { label: "High",     color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", bar: "bg-orange-500" },
  medium:   { label: "Medium",   color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", bar: "bg-yellow-500" },
  low:      { label: "Low",      color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/30",  bar: "bg-green-500" },
  info:     { label: "Info",     color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30",   bar: "bg-blue-500" },
  secure:   { label: "Secure",   color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/30",bar: "bg-emerald-500" },
} as const;

const LANGUAGES = [
  "javascript","typescript","python","java","go","rust","php",
  "ruby","c","cpp","csharp","shell","kotlin","swift",
];

function scfg(s: string) {
  return SEVERITY_CFG[s as keyof typeof SEVERITY_CFG] ?? SEVERITY_CFG.info;
}

// ─── SCORE RING ───────────────────────────────────────────────────────────────

function ScoreRing({ score, label }: { score: number; label: string }) {
  const pct = Math.round(score * 10);
  const color = score >= 8 ? "#10b981" : score >= 6 ? "#f59e0b" : score >= 4 ? "#f97316" : "#ef4444";
  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text x="40" y="44" textAnchor="middle" fontSize="16" fontWeight="bold" fill={color}>{score.toFixed(1)}</text>
      </svg>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

// ─── TAINT FLOW ───────────────────────────────────────────────────────────────

function TaintFlowViz({ steps }: { steps: TaintFlowStep[] }) {
  return (
    <div className="space-y-1">
      {steps.map((s, i) => (
        <div key={i}>
          <div className={cn(
            "rounded-lg border px-3 py-2 text-xs",
            i === 0 ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
            : i === steps.length - 1 ? "bg-red-500/10 border-red-500/30 text-red-300"
            : "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
          )}>
            <div className="font-mono font-bold">{s.label}</div>
            <div className="opacity-80 mt-0.5">{s.detail}</div>
          </div>
          {i < steps.length - 1 && (
            <div className="flex justify-center my-0.5">
              <ArrowDown className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── CODE DIFF ────────────────────────────────────────────────────────────────

function CodeDiff({ vulnerable, secure }: { vulnerable: string; secure: string }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold mb-1">
          <XCircle className="h-3 w-3" /> Vulnerable
        </div>
        <pre className="text-xs font-mono bg-red-500/5 border border-red-500/20 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap text-red-200/80">{vulnerable}</pre>
      </div>
      <div>
        <div className="flex items-center gap-1.5 text-xs text-green-400 font-semibold mb-1">
          <CheckCircle2 className="h-3 w-3" /> Secure Fix
        </div>
        <pre className="text-xs font-mono bg-green-500/5 border border-green-500/20 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap text-green-200/80">{secure}</pre>
      </div>
    </div>
  );
}

// ─── VULN CARD ────────────────────────────────────────────────────────────────

type VulnTab = "overview" | "attack" | "fix" | "code" | "taint" | "reasoning";

function VulnCard({ vuln, index }: { vuln: EnhancedVulnerability; index: number }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<VulnTab>("overview");
  const cfg = scfg(vuln.severity);

  const TABS: { id: VulnTab; label: string; icon: React.ElementType }[] = [
    { id: "overview",  label: "Overview",   icon: Eye },
    { id: "attack",    label: "Attack",     icon: Target },
    { id: "fix",       label: "Remediation",icon: Wrench },
    { id: "code",      label: "Code Diff",  icon: Code2 },
    { id: "taint",     label: "Taint Flow", icon: GitBranch },
    { id: "reasoning", label: "AI Reasoning",icon: Brain },
  ];

  return (
    <div className={cn("rounded-xl border overflow-hidden", cfg.border, cfg.bg)}>
      {/* Header */}
      <button
        className="w-full px-4 py-3 flex items-start gap-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border", cfg.bg, cfg.border)}>
          <Bug className={cn("h-3.5 w-3.5", cfg.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={cn("text-xs font-bold px-2 py-0.5 rounded border uppercase", cfg.color, cfg.bg, cfg.border)}>
              {cfg.label}
            </span>
            <span className="text-sm font-semibold">{vuln.title}</span>
            <span className="text-xs text-muted-foreground ml-auto">Line {vuln.lineStart}{vuln.lineEnd && vuln.lineEnd !== vuln.lineStart ? `–${vuln.lineEnd}` : ""}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className={cn("font-mono", cfg.color)}>Risk {vuln.riskScore.toFixed(1)}/10</span>
            <span>·</span>
            <span>Confidence {vuln.confidence}%</span>
            <span>·</span>
            <span>{vuln.cweId}</span>
            <span>·</span>
            <span className="truncate max-w-48">{vuln.owaspCategory}</span>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />}
      </button>

      {open && (
        <div className="border-t border-current/10">
          {/* Sub-tabs */}
          <div className="flex border-b border-current/10 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
                  tab === id
                    ? cn("border-current", cfg.color)
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-4">
            {tab === "overview" && (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1.5">Description</div>
                  <p className="text-sm">{vuln.description}</p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1.5">Root Cause</div>
                  <p className="text-sm leading-relaxed">{vuln.rootCause}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-xs font-semibold text-muted-foreground mb-1">OWASP</div>
                    <div className="text-xs font-medium">{vuln.owaspCategory}</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-xs font-semibold text-muted-foreground mb-1">CWE</div>
                    <div className="text-xs font-medium">{vuln.cweId} — {vuln.cweName}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1.5">Impact Analysis</div>
                  <p className="text-sm">{vuln.impactAnalysis}</p>
                </div>
              </div>
            )}

            {tab === "attack" && (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1.5">Attack Scenario</div>
                  <p className="text-sm leading-relaxed">{vuln.attackScenario}</p>
                </div>
                {vuln.exploitPayload && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1.5">Example Exploit Payload</div>
                    <pre className="text-xs font-mono bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 overflow-x-auto text-red-300">
                      {vuln.exploitPayload}
                    </pre>
                  </div>
                )}
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1.5">Impact</div>
                  <p className="text-sm">{vuln.impactAnalysis}</p>
                </div>
              </div>
            )}

            {tab === "fix" && (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-2">Remediation Steps</div>
                  <ol className="space-y-2">
                    {vuln.remediationSteps.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className={cn("flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold", cfg.bg, cfg.color, "border", cfg.border)}>
                          {i + 1}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>
                {vuln.bestPractices.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">Security Best Practices</div>
                    <ul className="space-y-1.5">
                      {vuln.bestPractices.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {tab === "code" && (
              <div>
                {vuln.vulnerableCode || vuln.secureCode
                  ? <CodeDiff vulnerable={vuln.vulnerableCode} secure={vuln.secureCode} />
                  : <div className="text-xs text-muted-foreground">No code diff available.</div>
                }
              </div>
            )}

            {tab === "taint" && (
              <div>
                {vuln.taintFlow.length > 0
                  ? (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-3">
                        Data flow from user-controlled source to dangerous sink
                      </div>
                      <TaintFlowViz steps={vuln.taintFlow} />
                    </div>
                  )
                  : <div className="text-xs text-muted-foreground">No taint flow data for this vulnerability type.</div>
                }
              </div>
            )}

            {tab === "reasoning" && (
              <div className="space-y-3">
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-violet-400" />
                    <span className="text-xs font-semibold text-violet-400">Why the AI flagged this</span>
                  </div>
                  <p className="text-sm leading-relaxed">{vuln.aiReasoning}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/30 rounded-lg p-2">
                    <div className="text-muted-foreground mb-0.5">Risk Score</div>
                    <div className={cn("font-bold text-base", cfg.color)}>{vuln.riskScore.toFixed(1)}/10</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2">
                    <div className="text-muted-foreground mb-0.5">Confidence</div>
                    <div className="font-bold text-base">{vuln.confidence}%</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SCAN RESULT ─────────────────────────────────────────────────────────────

type ScanTab = "findings" | "chains" | "architecture" | "priorities";

function ScanResult({ id }: { id: number }) {
  const [tab, setTab] = useState<ScanTab>("findings");

  const { data: scan } = useGetSecurityScan(id, {
    query: { refetchInterval: (q) => (q?.state?.data?.status === "pending" ? 2000 : false) },
  });

  if (!scan) return <Skeleton className="h-32 rounded-xl" />;

  if (scan.status === "pending") {
    return (
      <div className="bg-card border border-card-border rounded-xl p-5 flex items-center gap-3">
        <div className="relative">
          <Shield className="h-8 w-8 text-muted-foreground/30" />
          <RefreshCw className="h-3 w-3 text-primary animate-spin absolute -bottom-0.5 -right-0.5" />
        </div>
        <div>
          <div className="text-sm font-medium">{scan.filename ?? `${scan.language} snippet`}</div>
          <div className="text-xs text-yellow-400 mt-0.5 flex items-center gap-1">
            <RefreshCw className="h-2.5 w-2.5 animate-spin" />
            AI security audit in progress…
          </div>
        </div>
      </div>
    );
  }

  if (scan.status === "error") {
    return (
      <div className="bg-card border border-red-500/30 rounded-xl p-5 text-sm text-red-400 flex items-center gap-2">
        <XCircle className="h-4 w-4" /> Analysis failed. Please try again.
      </div>
    );
  }

  // Parse the stored JSON — handle both old format (array) and new format (EnhancedSecurityResult)
  const result: EnhancedSecurityResult | null = (() => {
    try {
      if (!scan.vulnerabilities) return null;
      const parsed = JSON.parse(scan.vulnerabilities);
      // Old format was a plain array
      if (Array.isArray(parsed)) return null;
      const p = parsed as Partial<EnhancedSecurityResult>;
      if (!p.vulnerabilities && !p.executiveSummary) return null;
      return {
        appSecurityScore: p.appSecurityScore ?? (10 - (scan.severityScore ?? 5)),
        riskPosture: p.riskPosture ?? "medium",
        severityBreakdown: p.severityBreakdown ?? { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        executiveSummary: p.executiveSummary ?? scan.summary ?? "",
        overallSummary: p.overallSummary ?? scan.summary ?? "",
        vulnerabilities: Array.isArray(p.vulnerabilities) ? p.vulnerabilities : [],
        chainedVulnerabilities: Array.isArray(p.chainedVulnerabilities) ? p.chainedVulnerabilities : [],
        securityArchitectureInsights: Array.isArray(p.securityArchitectureInsights) ? p.securityArchitectureInsights : [],
        topPriorities: Array.isArray(p.topPriorities) ? p.topPriorities : [],
        detectedFrameworks: Array.isArray(p.detectedFrameworks) ? p.detectedFrameworks : [],
      } satisfies EnhancedSecurityResult;
    } catch { return null; }
  })();

  // Legacy fallback for old scan format
  if (!result) {
    const legacyVulns = (() => {
      try { return scan.vulnerabilities ? (JSON.parse(scan.vulnerabilities) as Array<{ severity: string; line: number; description: string; fix: string }>) : []; }
      catch { return []; }
    })();
    return (
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-card-border flex items-center gap-3">
          <Shield className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm flex-1">{scan.filename ?? `${scan.language} snippet`}</span>
          <Badge variant="outline" className={cn("text-xs", scfg(scan.severityScore && scan.severityScore >= 7 ? "critical" : scan.severityScore && scan.severityScore >= 4 ? "medium" : "low").color)}>
            Score {scan.severityScore?.toFixed(1)}/10
          </Badge>
        </div>
        <div className="p-5 text-sm text-muted-foreground">
          {scan.summary && <p className="mb-3">{scan.summary}</p>}
          {legacyVulns.length === 0
            ? <div className="text-green-400 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> No vulnerabilities detected</div>
            : <div className="text-xs">{legacyVulns.length} vulnerabilities found (legacy format). Submit a new scan to see the full enhanced analysis.</div>
          }
        </div>
      </div>
    );
  }

  const postureCfg = scfg(result.riskPosture);
  const totalVulns = result.vulnerabilities.length;
  const TABS: { id: ScanTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "findings",     label: "Findings",     icon: Bug,       count: totalVulns },
    { id: "chains",       label: "Attack Chains", icon: Layers,    count: result.chainedVulnerabilities.length },
    { id: "architecture", label: "Architecture", icon: FileCode2 },
    { id: "priorities",   label: "Priorities",   icon: TrendingUp },
  ];

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-card-border">
        <div className="flex items-start gap-4 mb-4">
          {/* Score ring */}
          <ScoreRing score={result.appSecurityScore} label="Security Score" />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-semibold">{scan.filename ?? `${scan.language} snippet`}</span>
              <span className={cn("text-xs px-2 py-0.5 rounded border font-bold uppercase", postureCfg.color, postureCfg.bg, postureCfg.border)}>
                {result.riskPosture}
              </span>
              {result.detectedFrameworks.map((f) => (
                <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{result.executiveSummary}</p>
          </div>
        </div>

        {/* Severity breakdown */}
        <div className="flex flex-wrap gap-2">
          {(["critical","high","medium","low","info"] as const).map((s) => {
            const n = result.severityBreakdown[s] ?? 0;
            const c = scfg(s);
            return (
              <div key={s} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs", c.bg, c.border)}>
                <span className={cn("font-bold text-sm", c.color)}>{n}</span>
                <span className="text-muted-foreground">{c.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-card-border overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
              tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {count !== undefined && (
              <span className={cn("ml-0.5 px-1.5 py-0.5 rounded text-xs font-bold", tab === id ? "bg-primary/20" : "bg-muted")}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-5">
        {tab === "findings" && (
          <div className="space-y-3">
            {totalVulns === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                <div className="text-sm font-semibold text-emerald-400">No vulnerabilities detected</div>
                <div className="text-xs text-muted-foreground mt-1">This code appears secure.</div>
              </div>
            ) : (
              result.vulnerabilities.map((v, i) => <VulnCard key={v.id ?? i} vuln={v} index={i} />)
            )}
          </div>
        )}

        {tab === "chains" && (
          <div className="space-y-4">
            {result.chainedVulnerabilities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Layers className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No chained attack vectors detected.
              </div>
            ) : (
              result.chainedVulnerabilities.map((c, i) => {
                const cfg = scfg(c.severity);
                return (
                  <div key={i} className={cn("rounded-xl border p-4", cfg.bg, cfg.border)}>
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className={cn("h-4 w-4", cfg.color)} />
                      <span className="font-semibold text-sm">{c.title}</span>
                      <span className={cn("text-xs px-1.5 py-0.5 rounded border font-bold uppercase ml-auto", cfg.color, cfg.bg, cfg.border)}>
                        {c.severity}
                      </span>
                    </div>
                    <ol className="space-y-2">
                      {c.steps.map((s, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <span className={cn("flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border", cfg.bg, cfg.color, cfg.border)}>
                            {j + 1}
                          </span>
                          {s}
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "architecture" && (
          <div className="space-y-3">
            {result.securityArchitectureInsights.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <FileCode2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No architecture concerns detected.
              </div>
            ) : (
              result.securityArchitectureInsights.map((insight, i) => (
                <div key={i} className="flex items-start gap-3 bg-orange-500/5 border border-orange-500/20 rounded-xl px-4 py-3">
                  <AlertTriangle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{insight}</span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "priorities" && (
          <div className="space-y-3">
            {result.topPriorities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No priority actions.
              </div>
            ) : (
              result.topPriorities.map((p, i) => (
                <div key={i} className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-sm">{p}</span>
                </div>
              ))
            )}

            {result.overallSummary && (
              <div className="bg-muted/30 border border-border rounded-xl p-4 mt-4">
                <div className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" /> Technical Summary
                </div>
                <p className="text-sm">{result.overallSummary}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SAMPLE SNIPPETS ──────────────────────────────────────────────────────────

const SAMPLES: { label: string; language: string; filename: string; code: string }[] = [
  {
    label: "SQL Injection (Node.js)",
    language: "javascript",
    filename: "auth.js",
    code: `const express = require('express');
const mysql = require('mysql');
const app = express();
const db = mysql.createConnection({ host: 'localhost', user: 'root', password: 'admin123', database: 'users' });

app.get('/user', (req, res) => {
  const userId = req.query.id;
  const query = "SELECT * FROM users WHERE id = '" + userId + "'";
  db.query(query, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const sql = \`SELECT * FROM users WHERE username='\${username}' AND password='\${password}'\`;
  db.query(sql, (err, rows) => {
    if (rows.length > 0) res.send('Login success');
    else res.send('Invalid credentials');
  });
});`,
  },
  {
    label: "Command Injection (Python)",
    language: "python",
    filename: "scanner.py",
    code: `import os
import subprocess
from flask import Flask, request

app = Flask(__name__)

SECRET_KEY = "hardcoded_secret_abc123"
DB_PASSWORD = "mysupersecretpassword"

@app.route('/ping')
def ping():
    host = request.args.get('host')
    result = os.popen(f"ping -c 4 {host}").read()
    return result

@app.route('/scan')
def scan():
    target = request.args.get('target')
    output = subprocess.check_output("nmap " + target, shell=True)
    return output

@app.route('/file')
def read_file():
    filename = request.args.get('name')
    with open('/var/data/' + filename) as f:
        return f.read()`,
  },
  {
    label: "XSS + CSRF (React/Express)",
    language: "javascript",
    filename: "app.js",
    code: `// Express backend
app.get('/search', (req, res) => {
  const q = req.query.q;
  res.send(\`<h1>Results for: \${q}</h1>\`);
});

app.post('/transfer', (req, res) => {
  const { to, amount } = req.body;
  // No CSRF token check
  transferFunds(req.user.id, to, amount);
  res.json({ success: true });
});

// React frontend
function UserProfile({ user }) {
  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: user.bio }} />
      <img src={user.avatar} onError={"alert('xss')"} />
    </div>
  );
}

// JWT with weak secret
const token = jwt.sign({ userId: user.id }, 'secret', { algorithm: 'HS256' });
// No expiry set`,
  },
];

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function SecurityPage() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [filename, setFilename] = useState("");
  const [submittedIds, setSubmittedIds] = useState<number[]>([]);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: scans, isLoading } = useListSecurityScans();
  const { mutate: createScan, isPending } = useCreateSecurityScan({
    mutation: {
      onSuccess: (data) => {
        setSubmittedIds((ids) => [data.id, ...ids]);
        setCode("");
        setFilename("");
        qc.invalidateQueries({ queryKey: ["/api/security/scans"] });
        qc.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        qc.invalidateQueries({ queryKey: ["/api/dashboard/recent"] });
        toast({ title: "Audit started", description: "AI security engineer is analyzing your code…" });
      },
      onError: () => toast({ title: "Scan failed", variant: "destructive" }),
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    createScan({ data: { code, language, filename: filename || undefined } });
  }

  function loadSample(s: typeof SAMPLES[0]) {
    setCode(s.code);
    setLanguage(s.language);
    setFilename(s.filename);
  }

  const allIds = [
    ...submittedIds,
    ...(scans ?? []).map((s) => s.id).filter((id) => !submittedIds.includes(id)),
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-5 w-5 text-red-400" />
          <h1 className="text-2xl font-bold">AI Security Scanner</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Enterprise-grade AI security audit — root cause analysis, attack scenarios, CWE/OWASP mapping, taint flow, and secure code rewrites.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-xl p-5 mb-6 space-y-4">
        <div className="flex gap-3 flex-wrap">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            placeholder="Filename (optional, e.g. auth.py)"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="flex-1 min-w-48"
          />
        </div>

        <Textarea
          placeholder={`Paste your ${language} code here for a deep security audit…`}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="font-mono text-sm min-h-52 resize-y"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Load sample:</span>
            {SAMPLES.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => loadSample(s)}
                className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
          <Button type="submit" disabled={isPending || !code.trim()}>
            {isPending
              ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Auditing…</>
              : <><Shield className="h-4 w-4 mr-2" />Run Security Audit</>
            }
          </Button>
        </div>
      </form>

      <div className="space-y-5">
        {isLoading && allIds.length === 0
          ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          : allIds.length === 0
          ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Shield className="h-10 w-10 mx-auto mb-3 opacity-20" />
              No scans yet. Paste code or load a sample above.
            </div>
          )
          : allIds.map((id) => <ScanResult key={id} id={id} />)
        }
      </div>
    </div>
  );
}
