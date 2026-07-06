import { pgTable, text, serial, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const securityScansTable = pgTable("security_scans", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  code: text("code").notNull(),
  language: text("language").notNull(),
  filename: text("filename"),
  status: text("status").notNull().default("pending"),
  severityScore: doublePrecision("severity_score"),
  vulnerabilities: text("vulnerabilities"),
  summary: text("summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSecurityScanSchema = createInsertSchema(securityScansTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSecurityScan = z.infer<typeof insertSecurityScanSchema>;
export type SecurityScan = typeof securityScansTable.$inferSelect;
