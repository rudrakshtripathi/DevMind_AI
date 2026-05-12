import { openai } from "@workspace/integrations-openai-ai-server";

// ─── SECURITY SCANNER TYPES ──────────────────────────────────────────────────

export interface TaintFlowStep {
  label: string;
  detail: string;
}

export interface EnhancedVulnerability {
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

export interface ChainedVulnerability {
  title: string;
  steps: string[];
  severity: "critical" | "high" | "medium" | "low";
}

export interface EnhancedSecurityResult {
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

export async function analyzeCodeSecurity(
  code: string,
  language: string,
  filename?: string
): Promise<EnhancedSecurityResult & { severityScore: number; summary: string }> {
  const systemPrompt = `You are an elite application security engineer and AI code auditor equivalent to Snyk, Semgrep, CodeQL, and Checkmarx combined.

Perform deep semantic analysis of the provided source code. Understand execution flow, data taint paths, and contextual exploitability. Do NOT rely on simple keyword matching — reason about actual exploitability.

Return ONLY valid JSON matching this EXACT schema:

{
  "appSecurityScore": <0-10, where 0 = insecure, 10 = secure>,
  "riskPosture": "<critical|high|medium|low|secure>",
  "severityBreakdown": { "critical": <int>, "high": <int>, "medium": <int>, "low": <int>, "info": <int> },
  "executiveSummary": "<3-4 sentence executive-level summary of security posture, key risks, and recommended priorities>",
  "overallSummary": "<technical 2-3 sentence summary for developers>",
  "detectedFrameworks": ["<detected framework or runtime e.g. Express, React, Flask>"],
  "vulnerabilities": [
    {
      "id": "vuln_<n>",
      "title": "<vulnerability title e.g. SQL Injection via User Input>",
      "severity": "<critical|high|medium|low|info>",
      "riskScore": <0.0-10.0>,
      "confidence": <0-100 integer percentage>,
      "lineStart": <line number>,
      "lineEnd": <line number or same as lineStart>,
      "rootCause": "<deep explanation of WHY the vulnerability exists — which principle is violated, which code pattern causes it>",
      "description": "<technical description of the vulnerability>",
      "attackScenario": "<realistic step-by-step explanation of how an attacker would exploit this>",
      "exploitPayload": "<concrete example payload or attack string an attacker would use>",
      "impactAnalysis": "<what can an attacker achieve: RCE, data theft, auth bypass, privilege escalation, etc.>",
      "owaspCategory": "<e.g. A03:2021 - Injection>",
      "cweId": "<e.g. CWE-89>",
      "cweName": "<e.g. Improper Neutralization of Special Elements used in an SQL Command>",
      "remediationSteps": ["<step 1>", "<step 2>", "<step 3>"],
      "vulnerableCode": "<the exact vulnerable code snippet>",
      "secureCode": "<the corrected secure code with comments explaining the fix>",
      "taintFlow": [
        { "label": "<taint source e.g. req.query.id>", "detail": "<what this value represents>" },
        { "label": "<intermediate step e.g. String concatenation>", "detail": "<how data flows here>" },
        { "label": "<dangerous sink e.g. db.query()>", "detail": "<why this is dangerous>" }
      ],
      "aiReasoning": "<explain the pattern matched, execution flow traced, taint path, and why this is exploitable vs false positive>",
      "bestPractices": ["<practice 1>", "<practice 2>", "<practice 3>"]
    }
  ],
  "chainedVulnerabilities": [
    {
      "title": "<name of the attack chain>",
      "steps": ["<step 1>", "<step 2>", "<step 3>"],
      "severity": "<critical|high|medium|low>"
    }
  ],
  "securityArchitectureInsights": [
    "<insight about unsafe design patterns, weak authentication, poor secret handling, etc.>"
  ],
  "topPriorities": [
    "<prioritized action item 1>",
    "<prioritized action item 2>",
    "<prioritized action item 3>"
  ]
}

Rules:
- If no vulnerabilities exist, return empty arrays and appSecurityScore of 9-10
- Be realistic — only flag actual exploitable issues, not informational style nits unless truly important
- Always provide concrete exploitPayload examples
- Always provide before/after code in vulnerableCode and secureCode
- taintFlow must have at least 2 steps (source → sink) for injection-type vulns`;

  const userPrompt = `Perform a deep security audit of this ${language} code${filename ? ` (file: ${filename})` : ""}:

\`\`\`${language}
${code.slice(0, 30000)}
\`\`\`

Identify all security vulnerabilities with full root cause analysis, attack scenarios, CWE/OWASP mapping, and secure code rewrites.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 8192,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";

  try {
    const parsed = JSON.parse(content) as Partial<EnhancedSecurityResult>;
    const result: EnhancedSecurityResult = {
      appSecurityScore: parsed.appSecurityScore ?? 5,
      riskPosture: parsed.riskPosture ?? "medium",
      severityBreakdown: parsed.severityBreakdown ?? { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
      executiveSummary: parsed.executiveSummary ?? "",
      overallSummary: parsed.overallSummary ?? "",
      detectedFrameworks: Array.isArray(parsed.detectedFrameworks) ? parsed.detectedFrameworks : [],
      vulnerabilities: Array.isArray(parsed.vulnerabilities) ? parsed.vulnerabilities : [],
      chainedVulnerabilities: Array.isArray(parsed.chainedVulnerabilities) ? parsed.chainedVulnerabilities : [],
      securityArchitectureInsights: Array.isArray(parsed.securityArchitectureInsights) ? parsed.securityArchitectureInsights : [],
      topPriorities: Array.isArray(parsed.topPriorities) ? parsed.topPriorities : [],
    };
    // Compute legacy fields for DB compat
    const legacySeverityScore = 10 - result.appSecurityScore;
    return { ...result, severityScore: legacySeverityScore, summary: result.overallSummary };
  } catch {
    return {
      appSecurityScore: 5,
      riskPosture: "medium",
      severityBreakdown: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
      executiveSummary: content,
      overallSummary: content,
      detectedFrameworks: [],
      vulnerabilities: [],
      chainedVulnerabilities: [],
      securityArchitectureInsights: [],
      topPriorities: [],
      severityScore: 5,
      summary: content,
    };
  }
}

// ─── ENHANCED WORKFLOW TYPES ───────────────────────────────────────────────

export type NodeType =
  | "trigger" | "action" | "ai" | "decision" | "database"
  | "webhook" | "parallel" | "delay" | "retry" | "human_approval";

export interface DetailedStep {
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
  isBranch?: boolean;
  branchOf?: string;
}

export interface DataFlowItem {
  from: string;
  to: string;
  dataLabel: string;
  payload: string;
}

export interface ConditionalLogic {
  id: string;
  condition: string;
  truePath: string;
  falsePath: string;
  type: "filter" | "branch" | "retry_loop" | "parallel" | "fallback";
}

export interface ErrorScenario {
  step: string;
  scenario: string;
  retryCount: number;
  retryDelay: string;
  fallback: string;
  escalation: string;
}

export interface SecurityFinding {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  recommendation: string;
}

export interface SimulationStep {
  stepId: string;
  name: string;
  status: "success" | "failure" | "skipped";
  mockInput: string;
  mockOutput: string;
  duration: string;
  notes: string;
}

export interface DiagramNode {
  id: string;
  label: string;
  service: string;
  type: NodeType;
  action: string;
  condition?: string;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  type?: "success" | "failure" | "condition" | "default";
}

export interface EnhancedWorkflowResult {
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

export async function generateWorkflow(description: string): Promise<EnhancedWorkflowResult> {
  const systemPrompt = `You are an expert enterprise automation architect with deep knowledge of platforms like Zapier, n8n, Make.com, LangFlow, and Microsoft Power Automate.

When given a workflow description, generate a comprehensive, production-grade automation specification.

Return ONLY valid JSON matching this EXACT schema (no markdown, no extra text):

{
  "title": "<concise workflow title>",
  "summary": "<2-3 sentence plain English explanation of the entire automation>",
  "businessPurpose": "<why this automation provides business value and expected outcomes>",
  "complexityScore": <1-10 integer>,
  "estimatedTotalTime": "<e.g. '3-8 seconds per trigger'>",
  "steps": [
    {
      "id": "<step_id>",
      "stepNumber": <integer starting at 1>,
      "name": "<human readable step name>",
      "type": "<trigger|action|ai|decision|database|webhook|parallel|delay|retry|human_approval>",
      "service": "<service name e.g. GitHub, Slack, OpenAI, PostgreSQL>",
      "trigger": "<what triggers this step, or null>",
      "action": "<specific action performed>",
      "inputData": "<what data this step receives, with field names>",
      "outputData": "<what data this step produces, with field names>",
      "dependencies": ["<ids of steps this depends on>"],
      "estimatedTime": "<e.g. '200ms'>",
      "failurePossibilities": ["<failure scenario 1>", "<failure scenario 2>"],
      "retryStrategy": "<retry logic e.g. '3 retries with 2s exponential backoff'>",
      "securityRisk": "<security concern or null>",
      "condition": "<condition expression or null>",
      "isBranch": false,
      "branchOf": null
    }
  ],
  "conditions": [
    {
      "id": "<condition_id>",
      "condition": "<IF ... THEN ... description>",
      "truePath": "<step id for true branch>",
      "falsePath": "<step id for false branch>",
      "type": "<filter|branch|retry_loop|parallel|fallback>"
    }
  ],
  "dataFlow": [
    {
      "from": "<step name>",
      "to": "<step name>",
      "dataLabel": "<short label e.g. 'PR metadata'>",
      "payload": "<JSON-like structure of data passed>"
    }
  ],
  "errorHandling": [
    {
      "step": "<step name>",
      "scenario": "<what could go wrong>",
      "retryCount": <integer>,
      "retryDelay": "<e.g. '2s exponential'>",
      "fallback": "<fallback action>",
      "escalation": "<who/what gets notified on failure>"
    }
  ],
  "securityFindings": [
    {
      "type": "<finding type>",
      "severity": "<critical|high|medium|low>",
      "description": "<what the risk is>",
      "recommendation": "<how to mitigate>"
    }
  ],
  "securitySeverityScore": <1-10 integer>,
  "aiReasoning": "<3-5 paragraph explanation of why the workflow is designed this way>",
  "optimizationSuggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "diagram": {
    "nodes": [
      { "id": "<same as step id>", "label": "<short label>", "service": "<service>", "type": "<node type>", "action": "<action>", "condition": "<condition or null>" }
    ],
    "edges": [
      { "from": "<source step id>", "to": "<target step id>", "label": "<optional label>", "type": "<success|failure|condition|default>" }
    ]
  },
  "simulationSteps": [
    {
      "stepId": "<step id>",
      "name": "<step name>",
      "status": "<success|failure|skipped>",
      "mockInput": "<realistic mock input data as JSON string>",
      "mockOutput": "<realistic mock output data as JSON string>",
      "duration": "<simulated duration e.g. '342ms'>",
      "notes": "<what happened in this step>"
    }
  ]
}

Be specific, realistic, and production-grade. Include branching, error handling, and at least one decision node. Always include 4-8 steps minimum.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 8192,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Generate a production-grade automation workflow for:\n\n"${description}"` },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content) as EnhancedWorkflowResult;
  } catch {
    return {
      title: description,
      summary: "Workflow generation failed. Please try again.",
      businessPurpose: "",
      complexityScore: 1,
      estimatedTotalTime: "unknown",
      steps: [],
      conditions: [],
      dataFlow: [],
      errorHandling: [],
      securityFindings: [],
      securitySeverityScore: 0,
      aiReasoning: "",
      optimizationSuggestions: [],
      diagram: { nodes: [], edges: [] },
      simulationSteps: [],
    };
  }
}

// ─── CODEBASE AI ─────────────────────────────────────────────────────────────

export interface CodebaseAnswer {
  answer: string;
  sources: Array<{ file: string; line: number }>;
}

export async function queryCodebaseKnowledge(
  files: string,
  question: string
): Promise<CodebaseAnswer> {
  const systemPrompt = `You are a codebase expert assistant. You have been given the contents of a software repository.
Answer questions about the codebase by referencing specific files and line numbers where relevant.

You MUST return ONLY a valid JSON object — no markdown fences, no preamble.
Use this exact structure:
{
  "answer": "<detailed explanation answering the question, referencing specific code>",
  "sources": [
    { "file": "<filename>", "line": <line number> }
  ]
}

If no codebase content is provided, still answer as best you can and return an empty sources array.`;

  const filesContent = files.trim()
    ? `Codebase contents:\n\n${files.slice(0, 60000)}\n\n`
    : "No codebase content provided — answer based on the question alone.\n\n";

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 4096,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${filesContent}Question: ${question}` },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "";
  try {
    const parsed = JSON.parse(content) as Partial<CodebaseAnswer>;
    return {
      answer: parsed.answer ?? (content || "No answer returned."),
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    };
  } catch {
    return { answer: content || "Could not parse AI response.", sources: [] };
  }
}

// ─── ROOT CAUSE ANALYZER ─────────────────────────────────────────────────────

export interface FailureTimelineEvent {
  timestamp: string;
  service: string;
  event: string;
  type: "trigger" | "failure" | "cascade" | "recovery" | "alert";
}

export interface DependencyNode {
  name: string;
  type: "frontend" | "api" | "service" | "database" | "cache" | "queue" | "infra" | "external";
  status: "healthy" | "degraded" | "failed";
}

export interface RemediationPlan {
  immediate: string[];
  workaround: string[];
  longTerm: string[];
  rollback: string[];
  validation: string[];
}

export interface DebuggingPlaybook {
  commands: string[];
  logsToInspect: string[];
  metricsToCheck: string[];
  queries: string[];
}

export interface EnhancedIncidentAnalysis {
  incidentTitle: string;
  severity: "critical" | "high" | "medium" | "low";
  riskScore: number;
  confidence: number;
  executiveSummary: string;
  rootCause: string;
  affectedComponent: string;
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
  incidentType: string;
}

export async function analyzeIncident(logInput: string): Promise<EnhancedIncidentAnalysis & {
  confidence: number; remediation: string; severity: string;
}> {
  const systemPrompt = `You are an elite AI Site Reliability Engineer (SRE), DevOps Engineer, and Incident Responder — equivalent to a Datadog, Sentry, and Dynatrace AI combined.

Perform deep semantic analysis of error logs, stack traces, metrics, and system events. Correlate failures across services, identify primary root causes vs cascading symptoms, and generate comprehensive remediation and debugging guidance.

Return ONLY valid JSON matching this EXACT schema:

{
  "incidentTitle": "<concise incident name e.g. 'Database Connection Pool Exhaustion in PaymentService'>",
  "severity": "<critical|high|medium|low>",
  "riskScore": <0.0-10.0>,
  "confidence": <0-100 integer percentage>,
  "executiveSummary": "<2-3 sentence non-technical summary of the incident, its cause, and business impact>",
  "rootCause": "<deep technical explanation of WHY the failure occurred, WHICH code/config caused it, HOW it propagated>",
  "affectedComponent": "<primary affected service, function, class, or infrastructure component>",
  "incidentType": "<e.g. 'Database Failure', 'Memory Leak', 'Authentication Failure', 'Network Timeout', 'OOM Crash'>",
  "primaryFailure": "<the single root cause event that triggered everything else>",
  "secondaryFailures": [
    "<cascading failure or symptom 1>",
    "<cascading failure or symptom 2>"
  ],
  "failureTimeline": [
    {
      "timestamp": "<relative time or actual timestamp e.g. 'T+0s' or '14:23:01'>",
      "service": "<service or component name>",
      "event": "<what happened at this moment>",
      "type": "<trigger|failure|cascade|recovery|alert>"
    }
  ],
  "stackTraceAnalysis": "<line-by-line reasoning of the stack trace — which frame is the root cause, call chain explanation, thread state if visible>",
  "failingFunction": "<exact function/method name that failed>",
  "failingModule": "<file, class, or module where the failure originated>",
  "dependencyChain": [
    {
      "name": "<service or component name>",
      "type": "<frontend|api|service|database|cache|queue|infra|external>",
      "status": "<healthy|degraded|failed>"
    }
  ],
  "impactAnalysis": "<technical description of what systems are affected and how severely>",
  "userImpact": "<description of what end users experienced — errors, slowness, data loss, downtime>",
  "securityImplications": "<any security risks introduced or exposed by this failure — or 'None detected' if clean>",
  "remediationPlan": {
    "immediate": ["<step 1>", "<step 2>"],
    "workaround": ["<step 1>", "<step 2>"],
    "longTerm": ["<step 1>", "<step 2>"],
    "rollback": ["<step 1>", "<step 2>"],
    "validation": ["<step 1>", "<step 2>"]
  },
  "debuggingPlaybook": {
    "commands": ["<e.g. kubectl logs pod-name>", "<e.g. docker inspect container>"],
    "logsToInspect": ["<log file or source>"],
    "metricsToCheck": ["<metric name and what threshold to look for>"],
    "queries": ["<e.g. SELECT * FROM pg_stat_activity WHERE state = 'active'>"]
  },
  "preventionStrategy": [
    "<prevention measure 1>",
    "<prevention measure 2>"
  ],
  "monitoringRecommendations": [
    "<e.g. Alert when connection pool utilization > 80% for 5 minutes>",
    "<e.g. Set SLO: API p99 latency < 500ms>"
  ],
  "aiReasoning": "<3-4 paragraph explanation of HOW the AI reached this conclusion — what log patterns were correlated, what the failure chain analysis revealed, why this is the root cause vs noise>",
  "postmortem": "<structured postmortem in this format: 'Timeline: ... | Root Cause: ... | Contributing Factors: ... | Actions Taken: ... | Lessons Learned: ...' — each section on a new line>",
  "detectedTechnologies": ["<e.g. Java', 'HikariCP', 'PostgreSQL', 'Spring Boot'>"]
}

Rules:
- Always differentiate primary root cause from secondary cascading failures
- Timeline must be chronological and include at least 3 events
- Dependency chain shows the flow from healthy to failed components
- Generate realistic debugging commands for the detected technology stack
- If logs are unclear, still reason about the most likely cause from available evidence`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 8192,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Perform deep root cause analysis on these logs/traces:\n\n${logInput.slice(0, 30000)}` },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    const p = JSON.parse(content) as Partial<EnhancedIncidentAnalysis>;
    const result: EnhancedIncidentAnalysis = {
      incidentTitle: p.incidentTitle ?? "Unknown Incident",
      severity: p.severity ?? "medium",
      riskScore: p.riskScore ?? 5,
      confidence: p.confidence ?? 70,
      executiveSummary: p.executiveSummary ?? "",
      rootCause: p.rootCause ?? "",
      affectedComponent: p.affectedComponent ?? "Unknown",
      incidentType: p.incidentType ?? "Unknown",
      primaryFailure: p.primaryFailure ?? "",
      secondaryFailures: Array.isArray(p.secondaryFailures) ? p.secondaryFailures : [],
      failureTimeline: Array.isArray(p.failureTimeline) ? p.failureTimeline : [],
      stackTraceAnalysis: p.stackTraceAnalysis ?? "",
      failingFunction: p.failingFunction ?? "",
      failingModule: p.failingModule ?? "",
      dependencyChain: Array.isArray(p.dependencyChain) ? p.dependencyChain : [],
      impactAnalysis: p.impactAnalysis ?? "",
      userImpact: p.userImpact ?? "",
      securityImplications: p.securityImplications ?? "None detected",
      remediationPlan: p.remediationPlan ?? { immediate: [], workaround: [], longTerm: [], rollback: [], validation: [] },
      debuggingPlaybook: p.debuggingPlaybook ?? { commands: [], logsToInspect: [], metricsToCheck: [], queries: [] },
      preventionStrategy: Array.isArray(p.preventionStrategy) ? p.preventionStrategy : [],
      monitoringRecommendations: Array.isArray(p.monitoringRecommendations) ? p.monitoringRecommendations : [],
      aiReasoning: p.aiReasoning ?? "",
      postmortem: p.postmortem ?? "",
      detectedTechnologies: Array.isArray(p.detectedTechnologies) ? p.detectedTechnologies : [],
    };
    return {
      ...result,
      confidence: result.confidence / 100,
      remediation: result.remediationPlan.immediate.join("\n"),
    };
  } catch {
    return {
      incidentTitle: "Analysis Failed",
      severity: "medium",
      riskScore: 5,
      confidence: 0.5,
      executiveSummary: content,
      rootCause: content,
      affectedComponent: "Unknown",
      incidentType: "Unknown",
      primaryFailure: "",
      secondaryFailures: [],
      failureTimeline: [],
      stackTraceAnalysis: "",
      failingFunction: "",
      failingModule: "",
      dependencyChain: [],
      impactAnalysis: "",
      userImpact: "",
      securityImplications: "",
      remediationPlan: { immediate: [], workaround: [], longTerm: [], rollback: [], validation: [] },
      debuggingPlaybook: { commands: [], logsToInspect: [], metricsToCheck: [], queries: [] },
      preventionStrategy: [],
      monitoringRecommendations: [],
      aiReasoning: "",
      postmortem: "",
      detectedTechnologies: [],
      remediation: "",
    };
  }
}

export async function indexCodebase(files: string): Promise<{ fileCount: number }> {
  try {
    const parsed = JSON.parse(files) as Record<string, string>;
    return { fileCount: Object.keys(parsed).length };
  } catch {
    const lines = files.split("\n");
    return { fileCount: Math.max(1, Math.ceil(lines.length / 50)) };
  }
}
