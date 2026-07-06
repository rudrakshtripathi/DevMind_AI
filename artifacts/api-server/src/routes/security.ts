import { Router, type IRouter } from "express";
import { db, securityScansTable } from "@workspace/db";
import { desc, eq, avg, count, sql, and, isNull, or } from "drizzle-orm";
import {
  CreateSecurityScanBody,
  GetSecurityScanParams,
  ListSecurityScansResponse,
  GetSecurityScanResponse,
  GetSecurityStatsResponse,
} from "@workspace/api-zod";
import { analyzeCodeSecurity } from "../lib/ai.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

router.get("/security/scans", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const scans = await db
    .select()
    .from(securityScansTable)
    .where(eq(securityScansTable.userId, req.user.id))
    .orderBy(desc(securityScansTable.createdAt));
  res.json(ListSecurityScansResponse.parse(scans));
});

router.post("/security/scans", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = CreateSecurityScanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [scan] = await db
    .insert(securityScansTable)
    .values({
      userId: req.user.id,
      code: parsed.data.code,
      language: parsed.data.language,
      filename: parsed.data.filename ?? null,
      status: "pending",
    })
    .returning();

  res.status(201).json(GetSecurityScanResponse.parse(scan));

  (async () => {
    try {
      const result = await analyzeCodeSecurity(
        parsed.data.code,
        parsed.data.language,
        parsed.data.filename ?? undefined
      );
      await db
        .update(securityScansTable)
        .set({
          status: "complete",
          severityScore: result.severityScore,
          vulnerabilities: JSON.stringify(result),
          summary: result.summary,
        })
        .where(eq(securityScansTable.id, scan.id));
    } catch (err) {
      logger.error({ err, scanId: scan.id }, "Security analysis failed");
      await db
        .update(securityScansTable)
        .set({ status: "error" })
        .where(eq(securityScansTable.id, scan.id));
    }
  })();
});

router.get("/security/scans/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const params = GetSecurityScanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [scan] = await db
    .select()
    .from(securityScansTable)
    .where(
      and(
        eq(securityScansTable.id, params.data.id),
        eq(securityScansTable.userId, req.user.id)
      )
    );

  if (!scan) {
    res.status(404).json({ error: "Scan not found" });
    return;
  }

  res.json(GetSecurityScanResponse.parse(scan));
});

router.get("/security/stats", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [stats] = await db
    .select({
      totalScans: count(),
      avgSeverity: avg(securityScansTable.severityScore),
      criticalCount: sql<number>`count(*) filter (where vulnerabilities::text like '%"severity":"critical"%')`,
      highCount: sql<number>`count(*) filter (where vulnerabilities::text like '%"severity":"high"%')`,
      mediumCount: sql<number>`count(*) filter (where vulnerabilities::text like '%"severity":"medium"%')`,
      lowCount: sql<number>`count(*) filter (where vulnerabilities::text like '%"severity":"low"%')`,
    })
    .from(securityScansTable)
    .where(eq(securityScansTable.userId, req.user.id));

  res.json(
    GetSecurityStatsResponse.parse({
      totalScans: Number(stats.totalScans) || 0,
      criticalCount: Number(stats.criticalCount) || 0,
      highCount: Number(stats.highCount) || 0,
      mediumCount: Number(stats.mediumCount) || 0,
      lowCount: Number(stats.lowCount) || 0,
      avgSeverity: Number(stats.avgSeverity) || 0,
    })
  );
});

export default router;
