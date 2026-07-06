import { Router, type IRouter } from "express";
import { db, workflowsTable } from "@workspace/db";
import { desc, eq, and } from "drizzle-orm";
import {
  CreateWorkflowBody,
  GetWorkflowParams,
  ListWorkflowsResponse,
  GetWorkflowResponse,
} from "@workspace/api-zod";
import { generateWorkflow } from "../lib/ai.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

router.get("/workflows", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const workflows = await db
    .select()
    .from(workflowsTable)
    .where(eq(workflowsTable.userId, req.user.id))
    .orderBy(desc(workflowsTable.createdAt));
  res.json(ListWorkflowsResponse.parse(workflows));
});

router.post("/workflows", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = CreateWorkflowBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [workflow] = await db
    .insert(workflowsTable)
    .values({
      userId: req.user.id,
      description: parsed.data.description,
      status: "pending",
    })
    .returning();

  res.status(201).json(GetWorkflowResponse.parse(workflow));

  (async () => {
    try {
      const result = await generateWorkflow(parsed.data.description);
      await db
        .update(workflowsTable)
        .set({
          status: "complete",
          pipelineJson: JSON.stringify(result),
          diagramJson: JSON.stringify(result.diagram),
        })
        .where(eq(workflowsTable.id, workflow.id));
    } catch (err) {
      logger.error({ err, workflowId: workflow.id }, "Workflow generation failed");
      await db
        .update(workflowsTable)
        .set({ status: "error" })
        .where(eq(workflowsTable.id, workflow.id));
    }
  })();
});

router.get("/workflows/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const params = GetWorkflowParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [workflow] = await db
    .select()
    .from(workflowsTable)
    .where(
      and(
        eq(workflowsTable.id, params.data.id),
        eq(workflowsTable.userId, req.user.id)
      )
    );

  if (!workflow) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }

  res.json(GetWorkflowResponse.parse(workflow));
});

export default router;
