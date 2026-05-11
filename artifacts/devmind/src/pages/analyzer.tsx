import { useState } from "react";
import { useListIncidents, useCreateIncident, useGetIncident } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, RefreshCw, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

function severityConfig(s: string | null) {
  if (!s) return { color: "text-muted-foreground", bg: "bg-muted", label: "unknown" };
  return {
    critical: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", label: "Critical" },
    high: { color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", label: "High" },
    medium: { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", label: "Medium" },
    low: { color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", label: "Low" },
  }[s] ?? { color: "text-muted-foreground", bg: "bg-muted", label: s };
}

function IncidentResult({ id }: { id: number }) {
  const { data: incident } = useGetIncident(id, {
    query: { refetchInterval: (data) => (data?.state?.data?.status === "pending" ? 2000 : false) },
  });

  if (!incident) return <Skeleton className="h-40 rounded-xl" />;

  const sev = severityConfig(incident.severity ?? null);

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-card-border flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm flex-1 truncate">
          {incident.logInput.slice(0, 80)}…
        </span>
        {incident.status === "pending" && (
          <span className="flex items-center gap-1.5 text-xs text-yellow-400">
            <RefreshCw className="h-3 w-3 animate-spin" />Analyzing…
          </span>
        )}
        {incident.status === "complete" && incident.severity && (
          <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${sev.bg} ${sev.color}`}>
            {sev.label}
          </span>
        )}
        {incident.status === "error" && (
          <span className="text-xs text-red-400 flex items-center gap-1">
            <XCircle className="h-3 w-3" />Failed
          </span>
        )}
      </div>

      {incident.status === "complete" && (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Root Cause */}
          <div className={`rounded-xl border p-4 ${sev.bg}`}>
            <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${sev.color}`}>
              Root Cause
            </div>
            <p className="text-sm">{incident.rootCause}</p>
            {incident.affectedComponent && (
              <div className="mt-2 text-xs text-muted-foreground">
                Component: <span className="font-mono">{incident.affectedComponent}</span>
              </div>
            )}
            {incident.confidence && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-black/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${sev.color.replace("text-", "bg-")}`}
                    style={{ width: `${Math.round(incident.confidence * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.round(incident.confidence * 100)}% confidence
                </span>
              </div>
            )}
          </div>

          {/* Remediation */}
          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-green-400 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />Remediation Steps
            </div>
            <div className="text-sm whitespace-pre-wrap text-green-100/80">
              {incident.remediation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SAMPLE_LOGS = [
  `ERROR 2024-01-15 14:23:01 [payment-service] Connection pool exhausted
java.sql.SQLException: Timeout waiting for connection from pool
  at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:213)
  at PaymentService.processPayment(PaymentService.java:87)
ERROR 2024-01-15 14:23:05 [payment-service] Failed to process payment for order #48291`,

  `WARN 2024-01-15 10:15:22 [api-gateway] High memory usage: 87%
ERROR 2024-01-15 10:15:45 [api-gateway] OutOfMemoryError: Java heap space
  at java.util.Arrays.copyOf(Arrays.java:3210)
  at ResponseCacheService.cacheResponse(ResponseCacheService.java:142)`,

  `TypeError: Cannot read properties of undefined (reading 'user')
  at AuthMiddleware.verify (middleware/auth.js:23:18)
  at Layer.handle [as handle_request] (express/lib/router/layer.js:95:5)
  at next (express/lib/router/route.js:144:13)
  at Route.dispatch (express/lib/router/route.js:114:3)`,
];

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
        toast({ title: "Incident submitted", description: "AI is diagnosing the root cause…" });
      },
      onError: () => {
        toast({ title: "Failed to submit incident", variant: "destructive" });
      },
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
          Paste error logs, stack traces, or system metrics. AI identifies the root cause and provides remediation steps.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-xl p-5 mb-6 space-y-4">
        <Textarea
          placeholder={`Paste your error logs or stack trace here…\n\n${SAMPLE_LOGS[0]}`}
          value={logInput}
          onChange={(e) => setLogInput(e.target.value)}
          className="font-mono text-xs min-h-48 resize-y"
        />
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {SAMPLE_LOGS.map((log, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setLogInput(log)}
                className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              >
                Sample {i + 1}
              </button>
            ))}
          </div>
          <Button type="submit" disabled={isPending || !logInput.trim()}>
            {isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Analyze Root Cause
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
            No incidents yet. Paste some logs above to get started.
          </div>
        ) : (
          allIds.map((id) => <IncidentResult key={id} id={id} />)
        )}
      </div>
    </div>
  );
}
