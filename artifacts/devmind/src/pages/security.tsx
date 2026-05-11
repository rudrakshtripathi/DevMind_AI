import { useState } from "react";
import { useListSecurityScans, useCreateSecurityScan, useGetSecurityScan } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, ChevronDown, ChevronUp, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const LANGUAGES = ["javascript", "typescript", "python", "java", "go", "rust", "php", "ruby", "c", "cpp"];

function severityColor(s: string) {
  return s === "critical"
    ? "text-red-400 bg-red-500/10 border-red-500/30"
    : s === "high"
    ? "text-orange-400 bg-orange-500/10 border-orange-500/30"
    : s === "medium"
    ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
    : "text-green-400 bg-green-500/10 border-green-500/30";
}

function ScanResult({ id }: { id: number }) {
  const { data: scan, isLoading } = useGetSecurityScan(id, {
    query: { refetchInterval: (data) => (data?.state?.data?.status === "pending" ? 2000 : false) },
  });
  const [expanded, setExpanded] = useState<number | null>(null);

  if (isLoading || !scan) return <Skeleton className="h-32 rounded-xl" />;

  const vulns = scan.vulnerabilities ? (JSON.parse(scan.vulnerabilities) as Array<{
    severity: string; line: number; description: string; fix: string;
  }>) : [];

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-card-border flex items-center gap-3">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm flex-1">
          {scan.filename ?? `${scan.language} snippet`}
        </span>
        {scan.status === "pending" && (
          <span className="flex items-center gap-1.5 text-xs text-yellow-400">
            <RefreshCw className="h-3 w-3 animate-spin" />Analyzing…
          </span>
        )}
        {scan.status === "complete" && (
          <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${scan.severityScore! >= 7 ? severityColor("critical") : scan.severityScore! >= 4 ? severityColor("medium") : severityColor("low")}`}>
            Score {scan.severityScore?.toFixed(1)}/10
          </span>
        )}
        {scan.status === "error" && (
          <span className="text-xs text-red-400">Analysis failed</span>
        )}
      </div>

      {scan.status === "complete" && (
        <div className="p-5">
          {scan.summary && (
            <p className="text-sm text-muted-foreground mb-4">{scan.summary}</p>
          )}

          {vulns.length === 0 ? (
            <div className="text-sm text-green-400 flex items-center gap-2">
              <span>✓</span> No vulnerabilities detected
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                {vulns.length} {vulns.length === 1 ? "vulnerability" : "vulnerabilities"} found
              </div>
              {vulns.map((v, i) => (
                <div key={i} className={`rounded-lg border p-3 ${severityColor(v.severity)}`}>
                  <button
                    className="w-full text-left flex items-center justify-between"
                    onClick={() => setExpanded(expanded === i ? null : i)}
                  >
                    <span className="text-sm font-medium flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded uppercase font-bold ${severityColor(v.severity)}`}>
                        {v.severity}
                      </span>
                      Line {v.line}
                    </span>
                    {expanded === i ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  {expanded === i && (
                    <div className="mt-3 space-y-3 text-xs">
                      <div>
                        <div className="font-semibold mb-1 opacity-80">Issue</div>
                        <div className="opacity-90">{v.description}</div>
                      </div>
                      <div>
                        <div className="font-semibold mb-1 opacity-80">Fix</div>
                        <pre className="font-mono text-xs whitespace-pre-wrap opacity-90 bg-black/20 rounded p-2">
                          {v.fix}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
        toast({ title: "Scan submitted", description: "AI is analyzing your code…" });
      },
      onError: () => {
        toast({ title: "Failed to submit scan", variant: "destructive" });
      },
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    createScan({ data: { code, language, filename: filename || undefined } });
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
          Paste your code to detect SQL injection, XSS, CSRF, insecure patterns, and OWASP Top 10 vulnerabilities.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-xl p-5 mb-6 space-y-4">
        <div className="flex gap-3">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Filename (optional, e.g. auth.py)"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="flex-1"
          />
        </div>
        <Textarea
          placeholder={`Paste your ${language} code here…`}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="font-mono text-sm min-h-48 resize-y"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending || !code.trim()}>
            {isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Scanning…
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Scan for Vulnerabilities
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Results */}
      <div className="space-y-4">
        {isLoading && allIds.length === 0 ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : allIds.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <AlertCircle className="h-8 w-8 mx-auto mb-3 opacity-30" />
            No scans yet. Paste some code above to get started.
          </div>
        ) : (
          allIds.map((id) => <ScanResult key={id} id={id} />)
        )}
      </div>
    </div>
  );
}
