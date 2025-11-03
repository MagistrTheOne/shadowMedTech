import { pgTable, text, integer, timestamp, uuid, boolean, jsonb, pgEnum, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'trainer', 'manager', 'rep']);
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['starter', 'professional', 'enterprise']);
export const doctorPersonalityEnum = pgEnum('doctor_personality', ['demanding', 'quiet', 'aggressive', 'rational', 'empathetic']);
export const difficultyLevelEnum = pgEnum('difficulty_level', ['beginner', 'intermediate', 'advanced', 'expert']);
export const visitStatusEnum = pgEnum('visit_status', ['scheduled', 'in_progress', 'completed', 'cancelled']);

// Companies table
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  subscriptionPlan: subscriptionPlanEnum('subscription_plan').default('starter'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: userRoleEnum('role').default('rep').notNull(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Doctors table
export const doctors = pgTable('doctors', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  personalityType: doctorPersonalityEnum('personality_type').default('rational').notNull(),
  empathyLevel: integer('empathy_level').default(5).notNull(), // 1-10 scale
  avatarUrl: text('avatar_url'),
  promptTemplate: text('prompt_template').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Medications table
export const medications = pgTable('medications', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Scenarios table
export const scenarios = pgTable('scenarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  medicationId: uuid('medication_id').references(() => medications.id, { onDelete: 'set null' }),
  difficultyLevel: difficultyLevelEnum('difficulty_level').default('intermediate').notNull(),
  promptTemplate: text('prompt_template').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Visits table
export const visits = pgTable('visits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  scenarioId: uuid('scenario_id').references(() => scenarios.id, { onDelete: 'cascade' }).notNull(),
  doctorId: uuid('doctor_id').references(() => doctors.id, { onDelete: 'cascade' }).notNull(),
  status: visitStatusEnum('status').default('scheduled').notNull(),
  livekitRoomName: varchar('livekit_room_name', { length: 256 }),
  egressId: varchar('egress_id', { length: 256 }), // LiveKit Egress ID for recording
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  duration: integer('duration'), // in seconds
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Visit Messages table
export const visitMessages = pgTable('visit_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  visitId: uuid('visit_id').references(() => visits.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').notNull(), // 'user' or 'assistant' (doctor)
  content: text('content').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  metadata: jsonb('metadata'), // Store STT/TTS metadata, audio URLs, etc.
});

// Evaluations table
export const evaluations = pgTable('evaluations', {
  id: uuid('id').primaryKey().defaultRandom(),
  visitId: uuid('visit_id').references(() => visits.id, { onDelete: 'cascade' }).notNull(),
  score: integer('score').notNull(), // 0-100 scale
  feedbackText: text('feedback_text'),
  metricsJson: jsonb('metrics_json'), // Detailed evaluation metrics
  recommendations: jsonb('recommendations'), // Improvement suggestions
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  visits: many(visits),
}));

export const doctorsRelations = relations(doctors, ({ many }) => ({
  visits: many(visits),
}));

export const medicationsRelations = relations(medications, ({ many }) => ({
  scenarios: many(scenarios),
}));

export const scenariosRelations = relations(scenarios, ({ one, many }) => ({
  medication: one(medications, {
    fields: [scenarios.medicationId],
    references: [medications.id],
  }),
  visits: many(visits),
}));

export const visitsRelations = relations(visits, ({ one, many }) => ({
  user: one(users, {
    fields: [visits.userId],
    references: [users.id],
  }),
  scenario: one(scenarios, {
    fields: [visits.scenarioId],
    references: [scenarios.id],
  }),
  doctor: one(doctors, {
    fields: [visits.doctorId],
    references: [doctors.id],
  }),
  messages: many(visitMessages),
  evaluation: one(evaluations),
}));

export const visitMessagesRelations = relations(visitMessages, ({ one }) => ({
  visit: one(visits, {
    fields: [visitMessages.visitId],
    references: [visits.id],
  }),
}));

export const evaluationsRelations = relations(evaluations, ({ one }) => ({
  visit: one(visits, {
    fields: [evaluations.visitId],
    references: [visits.id],
  }),
}));

// Types
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Doctor = typeof doctors.$inferSelect;
export type NewDoctor = typeof doctors.$inferInsert;

export type Medication = typeof medications.$inferSelect;
export type NewMedication = typeof medications.$inferInsert;

export type Scenario = typeof scenarios.$inferSelect;
export type NewScenario = typeof scenarios.$inferInsert;

export type Visit = typeof visits.$inferSelect;
export type NewVisit = typeof visits.$inferInsert;

export type VisitMessage = typeof visitMessages.$inferSelect;
export type NewVisitMessage = typeof visitMessages.$inferInsert;

export type Evaluation = typeof evaluations.$inferSelect;
export type NewEvaluation = typeof evaluations.$inferInsert;
