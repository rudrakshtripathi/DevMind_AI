import { Router, type IRouter } from "express";
import { db, securityScansTable, workflowsTable, codebaseProjectsTable, incidentsTable } from "@workspace/db";
import { desc, count, avg, gte, sql, eq } from "drizzle-orm";
import {
  GetDashboardStatsResponse,
  GetRecentActivityResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [secStats] = await db
    .select({ total: count(), avg: avg(securityScansTable.severityScore) })
    .from(securityScansTable)
    .where(eq(securityScansTable.userId, userId));

  const [wfStats] = await db
    .select({ total: count() })
    .from(workflowsTable)
    .where(eq(workflowsTable.userId, userId));

  const [cbStats] = await db
    .select({ total: count() })
    .from(codebaseProjectsTable)
    .where(eq(codebaseProjectsTable.userId, userId));

  const [inStats] = await db
    .select({ total: count() })
    .from(incidentsTable)
    .where(eq(incidentsTable.userId, userId));

  const [recentStats] = await db
    .select({ recent: count() })
    .from(securityScansTable)
    .where(
      sql`${securityScansTable.userId} = ${userId} AND ${securityScansTable.createdAt} >= ${sevenDaysAgo}`
    );

  res.json(
    GetDashboardStatsResponse.parse({
      totalScans: Number(secStats.total) || 0,
      totalWorkflows: Number(wfStats.total) || 0,
      totalProjects: Number(cbStats.total) || 0,
      totalIncidents: Number(inStats.total) || 0,
      recentScans: Number(recentStats.recent) || 0,
      avgSeverityScore: Number(secStats.avg) || 0,
    })
  );
});

router.get("/dashboard/recent", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;

  const recentScans = await db
    .select({
      id: securityScansTable.id,
      title: sql<string>`concat(${securityScansTable.language}, ' scan')`,
      status: securityScansTable.status,
      severity: sql<string | null>`null`,
      createdAt: securityScansTable.createdAt,
    })
    .from(securityScansTable)
    .where(eq(securityScansTable.userId, userId))
    .orderBy(desc(securityScansTable.createdAt))
    .limit(5);

  const recentWorkflows = await db
    .select({
      id: workflowsTable.id,
      title: workflowsTable.description,
      status: workflowsTable.status,
      severity: sql<string | null>`null`,
      createdAt: workflowsTable.createdAt,
    })
    .from(workflowsTable)
    .where(eq(workflowsTable.userId, userId))
    .orderBy(desc(workflowsTable.createdAt))
    .limit(5);

  const recentIncidents = await db
    .select({
      id: incidentsTable.id,
      title: sql<string>`substring(${incidentsTable.logInput}, 1, 60)`,
      status: incidentsTable.status,
      severity: incidentsTable.severity,
      createdAt: incidentsTable.createdAt,
    })
    .from(incidentsTable)
    .where(eq(incidentsTable.userId, userId))
    .orderBy(desc(incidentsTable.createdAt))
    .limit(5);

  const activity = [
    ...recentScans.map((s) => ({ ...s, module: "security" })),
    ...recentWorkflows.map((w) => ({ ...w, module: "workflow" })),
    ...recentIncidents.map((i) => ({ ...i, module: "analyzer" })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 15);

  res.json(GetRecentActivityResponse.parse(activity));
});

export default router;
