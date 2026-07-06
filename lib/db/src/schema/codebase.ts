import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const codebaseProjectsTable = pgTable("codebase_projects", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  fileCount: integer("file_count"),
  files: text("files"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const codebaseQuestionsTable = pgTable("codebase_questions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sources: text("sources"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCodebaseProjectSchema = createInsertSchema(codebaseProjectsTable).omit({
  id: true,
  createdAt: true,
});
export const insertCodebaseQuestionSchema = createInsertSchema(codebaseQuestionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCodebaseProject = z.infer<typeof insertCodebaseProjectSchema>;
export type CodebaseProject = typeof codebaseProjectsTable.$inferSelect;
export type InsertCodebaseQuestion = z.infer<typeof insertCodebaseQuestionSchema>;
export type CodebaseQuestion = typeof codebaseQuestionsTable.$inferSelect;
