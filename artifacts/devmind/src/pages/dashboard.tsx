import { useGetDashboardStats, useGetRecentActivity } from "@/lib/api";
import { Shield, Workflow, BookOpen, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5 flex gap-4 items-start">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function severityBadge(severity: string | null) {
  if (!severity) return null;
  const map: Record<string, string> = {
    critical: "bg-red-500/15 text-red-400 border-red-500/30",
    high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    low: "bg-green-500/15 text-green-400 border-green-500/30",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${map[severity] ?? ""}`}>
      {severity}
    </span>
  );
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    complete: "bg-green-500/15 text-green-400 border-green-500/30",
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    error: "bg-red-500/15 text-red-400 border-red-500/30",
    indexed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

function moduleLabel(module: string) {
  const map: Record<string, string> = {
    security: "Security",
    workflow: "Workflow",
    analyzer: "Incident",
  };
  return map[module] ?? module;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <img
          src="/devmind-logo.png"
          alt="DevMind AI"
          className="w-14 h-14 rounded-2xl object-cover shadow-lg shadow-primary/20 flex-shrink-0"
        />
        <div>
          <h1 className="text-2xl font-bold">DevMind AI</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Overview of your AI-powered developer intelligence platform.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              icon={Shield}
              label="Security Scans"
              value={stats?.totalScans ?? 0}
              color="bg-red-500/10 text-red-400"
              sub={`Avg severity: ${(stats?.avgSeverityScore ?? 0).toFixed(1)}/10`}
            />
            <StatCard
              icon={Workflow}
              label="Workflows Built"
              value={stats?.totalWorkflows ?? 0}
              color="bg-blue-500/10 text-blue-400"
            />
            <StatCard
              icon={BookOpen}
              label="Codebase Projects"
              value={stats?.totalProjects ?? 0}
              color="bg-purple-500/10 text-purple-400"
            />
            <StatCard
              icon={AlertTriangle}
              label="Incidents Analyzed"
              value={stats?.totalIncidents ?? 0}
              color="bg-orange-500/10 text-orange-400"
            />
          </>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-card-border rounded-xl">
        <div className="px-5 py-4 border-b border-card-border flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Recent Activity</h2>
        </div>
        <div className="divide-y divide-border">
          {activityLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-3">
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))
          ) : !activity || activity.length === 0 ? (
            <div className="px-5 py-8 text-center text-muted-foreground text-sm">
              No recent activity. Start by running a security scan or creating a workflow.
            </div>
          ) : (
            activity.map((item) => (
              <div key={`${item.module}-${item.id}`} className="px-5 py-3 flex items-center gap-3">
                <Badge variant="outline" className="text-xs shrink-0">
                  {moduleLabel(item.module)}
                </Badge>
                <span className="text-sm flex-1 truncate">{item.title}</span>
                {item.severity && severityBadge(item.severity)}
                {statusBadge(item.status)}
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {[
          {
            icon: Shield,
            title: "AI Security Scanner",
            desc: "Detect vulnerabilities, SQL injection, XSS, and OWASP Top 10 issues in your code.",
            color: "text-red-400",
            href: "/security",
          },
          {
            icon: Workflow,
            title: "AI Workflow Builder",
            desc: "Convert natural language into visual automation pipelines connecting your tools.",
            color: "text-blue-400",
            href: "/workflows",
          },
          {
            icon: BookOpen,
            title: "Codebase Knowledge AI",
            desc: "Ask questions about any codebase. Get precise answers with file and line references.",
            color: "text-purple-400",
            href: "/codebase",
          },
          {
            icon: AlertTriangle,
            title: "Root Cause Analyzer",
            desc: "Paste error logs or stack traces. Get instant root cause diagnosis and remediation steps.",
            color: "text-orange-400",
            href: "/analyzer",
          },
        ].map(({ icon: Icon, title, desc, color, href }) => (
          <a
            key={href}
            href={href}
            className="bg-card border border-card-border rounded-xl p-5 hover:border-primary/50 transition-colors group"
          >
            <Icon className={`h-6 w-6 mb-3 ${color}`} />
            <div className="font-semibold text-sm mb-1">{title}</div>
            <div className="text-xs text-muted-foreground">{desc}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
