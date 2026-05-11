import { Router, type IRouter } from "express";
import { db, codebaseProjectsTable, codebaseQuestionsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import {
  CreateCodebaseProjectBody,
  QueryCodebaseParams,
  QueryCodebaseBody,
  ListCodebaseQuestionsParams,
  ListCodebaseProjectsResponse,
  QueryCodebaseResponse,
  ListCodebaseQuestionsResponse,
} from "@workspace/api-zod";
import { queryCodebaseKnowledge, indexCodebase } from "../lib/ai.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

router.get("/codebase/projects", async (_req, res): Promise<void> => {
  const projects = await db
    .select()
    .from(codebaseProjectsTable)
    .orderBy(desc(codebaseProjectsTable.createdAt));
  res.json(ListCodebaseProjectsResponse.parse(projects));
});

router.post("/codebase/projects", async (req, res): Promise<void> => {
  const parsed = CreateCodebaseProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db
    .insert(codebaseProjectsTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      files: parsed.data.files ?? null,
      status: "pending",
    })
    .returning();

  res.status(201).json(project);

  // Index in background
  (async () => {
    try {
      const files = parsed.data.files ?? "";
      const { fileCount } = await indexCodebase(files);
      await db
        .update(codebaseProjectsTable)
        .set({ status: "indexed", fileCount })
        .where(eq(codebaseProjectsTable.id, project.id));
    } catch (err) {
      logger.error({ err, projectId: project.id }, "Codebase indexing failed");
      await db
        .update(codebaseProjectsTable)
        .set({ status: "error" })
        .where(eq(codebaseProjectsTable.id, project.id));
    }
  })();
});

router.post("/codebase/projects/:id/query", async (req, res): Promise<void> => {
  const params = QueryCodebaseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = QueryCodebaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db
    .select()
    .from(codebaseProjectsTable)
    .where(eq(codebaseProjectsTable.id, params.data.id));

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const answer = await queryCodebaseKnowledge(
    project.files ?? "",
    parsed.data.question
  );

  const [question] = await db
    .insert(codebaseQuestionsTable)
    .values({
      projectId: project.id,
      question: parsed.data.question,
      answer: answer.answer,
      sources: JSON.stringify(answer.sources),
    })
    .returning();

  res.json(QueryCodebaseResponse.parse({
    id: question.id,
    projectId: question.projectId,
    question: question.question,
    answer: question.answer,
    sources: question.sources,
    createdAt: question.createdAt,
  }));
});

router.get("/codebase/projects/:id/questions", async (req, res): Promise<void> => {
  const params = ListCodebaseQuestionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const questions = await db
    .select()
    .from(codebaseQuestionsTable)
    .where(eq(codebaseQuestionsTable.projectId, params.data.id))
    .orderBy(desc(codebaseQuestionsTable.createdAt));

  res.json(ListCodebaseQuestionsResponse.parse(questions));
});

export default router;
