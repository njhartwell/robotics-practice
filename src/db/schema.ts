import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const currentTimestamp = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  image: text("image"),
  role: text("role", { enum: ["student", "admin"] })
    .default("student")
    .notNull(),
  accessStatus: text("access_status", {
    enum: ["pending", "approved", "rejected"],
  })
    .default("pending")
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(currentTimestamp)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(currentTimestamp)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(currentTimestamp)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
);

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp_ms",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp_ms",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(currentTimestamp)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [index("account_userId_idx").on(table.userId)]);

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(currentTimestamp)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(currentTimestamp)
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [index("verification_identifier_idx").on(table.identifier)]);

export const userProgress = sqliteTable("user_progress", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  document: text("document", { mode: "json" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(currentTimestamp)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const invitation = sqliteTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    tokenHash: text("token_hash").notNull(),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["pending", "accepted", "revoked", "expired"],
    })
      .default("pending")
      .notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    acceptedAt: integer("accepted_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(currentTimestamp)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(currentTimestamp)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("invitation_email_idx").on(table.email),
    uniqueIndex("invitation_token_hash_idx").on(table.tokenHash),
    index("invitation_status_idx").on(table.status),
  ]
);

export const feedback = sqliteTable(
  "feedback",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonSlug: text("lesson_slug").notNull(),
    part: text("part", { enum: ["playground", "ide-projects"] }).notNull(),
    stepId: text("step_id"),
    kind: text("kind", { enum: ["lesson", "inline"] }).notNull(),
    rating: integer("rating"),
    comment: text("comment"),
    status: text("status", { enum: ["new", "reviewed", "resolved"] })
      .default("new")
      .notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(currentTimestamp)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(currentTimestamp)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("feedback_user_id_idx").on(table.userId),
    index("feedback_lesson_slug_idx").on(table.lessonSlug),
    index("feedback_status_idx").on(table.status),
    index("feedback_created_at_idx").on(table.createdAt),
  ]
);

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  progress: one(userProgress),
  invitations: many(invitation),
  feedback: many(feedback),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(user, {
    fields: [userProgress.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  inviter: one(user, {
    fields: [invitation.invitedBy],
    references: [user.id],
  }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(user, {
    fields: [feedback.userId],
    references: [user.id],
  }),
}));
