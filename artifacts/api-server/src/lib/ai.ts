import { openai } from "@workspace/integrations-openai-ai-server";

export interface Vulnerability {
  severity: "critical" | "high" | "medium" | "low";
  line: number;
  description: string;
  fix: string;
}

export interface SecurityAnalysisResult {
  severityScore: number;
  vulnerabilities: Vulnerability[];
  summary: string;
}

export async function analyzeCodeSecurity(
  code: string,
  language: string,
  filename?: string
): Promise<SecurityAnalysisResult> {
  const systemPrompt = `You are an expert security engineer specializing in code vulnerability analysis. 
Analyze code for security vulnerabilities including: SQL injection, XSS, CSRF, insecure dependencies, 
hardcoded secrets, path traversal, insecure deserialization, weak cryptography, OWASP Top 10 issues.

Return ONLY valid JSON with this exact structure:
{
  "severityScore": <number 0-10, where 10 is most severe>,
  "vulnerabilities": [
    {
      "severity": "<critical|high|medium|low>",
      "line": <line number where issue exists>,
      "description": "<clear description of the vulnerability and why it's dangerous>",
      "fix": "<corrected code or specific remediation steps>"
    }
  ],
  "summary": "<2-3 sentence overall security assessment>"
}

If no vulnerabilities found, return empty array and severityScore of 0.`;

  const userPrompt = `Analyze this ${language} code${filename ? ` (file: ${filename})` : ""} for security vulnerabilities:\n\n\`\`\`${language}\n${code}\n\`\`\``;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as SecurityAnalysisResult;
  return parsed;
}

export interface PipelineStep {
  id: string;
  name: string;
  service: string;
  action: string;
  trigger?: string;
  condition?: string;
}

export interface DiagramNode {
  id: string;
  label: string;
  service: string;
  action: string;
}

export interface DiagramEdge {
  from: string;
  to: string;
}

export interface WorkflowResult {
  steps: PipelineStep[];
  diagram: {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
  };
}

export async function generateWorkflow(description: string): Promise<WorkflowResult> {
  const systemPrompt = `You are an automation pipeline architect. Convert natural language workflow descriptions 
into structured pipeline definitions.

Return ONLY valid JSON with this exact structure:
{
  "steps": [
    {
      "id": "<step_id>",
      "name": "<human readable name>",
      "service": "<service name e.g. GitHub, Slack, Notion, JIRA, Email>",
      "action": "<action e.g. 'PR merged', 'Send message', 'Update page'>",
      "trigger": "<optional: what triggers this step>",
      "condition": "<optional: condition for execution>"
    }
  ],
  "diagram": {
    "nodes": [
      { "id": "<same as step id>", "label": "<step name>", "service": "<service>", "action": "<action>" }
    ],
    "edges": [
      { "from": "<source step id>", "to": "<target step id>" }
    ]
  }
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Generate an automation pipeline for: ${description}` },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  return JSON.parse(content) as WorkflowResult;
}

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

Return ONLY valid JSON with this exact structure:
{
  "answer": "<detailed explanation answering the question, referencing specific code>",
  "sources": [
    { "file": "<filename>", "line": <line number> }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Codebase contents:\n\n${files.slice(0, 50000)}\n\nQuestion: ${question}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  return JSON.parse(content) as CodebaseAnswer;
}

export interface IncidentAnalysis {
  rootCause: string;
  affectedComponent: string;
  confidence: number;
  remediation: string;
  severity: "critical" | "high" | "medium" | "low";
}

export async function analyzeIncident(logInput: string): Promise<IncidentAnalysis> {
  const systemPrompt = `You are a senior site reliability engineer specializing in incident diagnosis.
Analyze error logs, stack traces, and system metrics to identify root causes.

Return ONLY valid JSON with this exact structure:
{
  "rootCause": "<clear explanation of the root cause>",
  "affectedComponent": "<the specific service, function, or system component>",
  "confidence": <0.0-1.0 confidence score>,
  "remediation": "<numbered steps for remediation, separated by newlines e.g. '1. Check X\\n2. Fix Y\\n3. Deploy Z'>",
  "severity": "<critical|high|medium|low>"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Analyze these logs/traces:\n\n${logInput}` },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  return JSON.parse(content) as IncidentAnalysis;
}

export async function indexCodebase(
  files: string
): Promise<{ fileCount: number }> {
  try {
    const parsed = JSON.parse(files) as Record<string, string>;
    return { fileCount: Object.keys(parsed).length };
  } catch {
    const lines = files.split("\n");
    return { fileCount: Math.max(1, Math.ceil(lines.length / 50)) };
  }
}
