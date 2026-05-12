import { Router, type IRouter } from "express";
import { db, incidentsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import {
  CreateIncidentBody,
  GetIncidentParams,
  ListIncidentsResponse,
  GetIncidentResponse,
} from "@workspace/api-zod";
import { analyzeIncident } from "../lib/ai.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

router.get("/analyzer/incidents", async (_req, res): Promise<void> => {
  const incidents = await db
    .select()
    .from(incidentsTable)
    .orderBy(desc(incidentsTable.createdAt));
  res.json(ListIncidentsResponse.parse(incidents));
});

router.post("/analyzer/incidents", async (req, res): Promise<void> => {
  const parsed = CreateIncidentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [incident] = await db
    .insert(incidentsTable)
    .values({
      logInput: parsed.data.logInput,
      status: "pending",
    })
    .returning();

  res.status(201).json(GetIncidentResponse.parse(incident));

  (async () => {
    try {
      const result = await analyzeIncident(parsed.data.logInput);
      await db
        .update(incidentsTable)
        .set({
          status: "complete",
          rootCause: result.rootCause,
          affectedComponent: result.affectedComponent,
          confidence: result.confidence,
          severity: result.severity,
          // Store full enhanced result as JSON in remediation field
          remediation: JSON.stringify(result),
        })
        .where(eq(incidentsTable.id, incident.id));
    } catch (err) {
      logger.error({ err, incidentId: incident.id }, "Incident analysis failed");
      await db
        .update(incidentsTable)
        .set({ status: "error" })
        .where(eq(incidentsTable.id, incident.id));
    }
  })();
});

router.get("/analyzer/incidents/:id", async (req, res): Promise<void> => {
  const params = GetIncidentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [incident] = await db
    .select()
    .from(incidentsTable)
    .where(eq(incidentsTable.id, params.data.id));

  if (!incident) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }

  res.json(GetIncidentResponse.parse(incident));
});

export default router;
