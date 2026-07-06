import { pgTable, text, serial, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const incidentsTable = pgTable("incidents", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  logInput: text("log_input").notNull(),
  status: text("status").notNull().default("pending"),
  rootCause: text("root_cause"),
  affectedComponent: text("affected_component"),
  confidence: doublePrecision("confidence"),
  remediation: text("remediation"),
  severity: text("severity"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertIncidentSchema = createInsertSchema(incidentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Incident = typeof incidentsTable.$inferSelect;
