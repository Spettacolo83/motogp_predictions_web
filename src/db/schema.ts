import { sqliteTable, text, integer, real, primaryKey } from "drizzle-orm/sqlite-core";

// ===== AUTH.JS TABLES =====

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  nickname: text("nickname").unique(),
  role: text("role", { enum: ["user", "admin"] })
    .notNull()
    .default("user"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const accounts = sqliteTable("accounts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = sqliteTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

// ===== APP TABLES =====

export const invitationCodes = sqliteTable("invitation_codes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  maxUses: integer("max_uses").notNull().default(50),
  currentUses: integer("current_uses").notNull().default(0),
});

export const races = sqliteTable("races", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  round: integer("round").notNull(),
  name: text("name").notNull(),
  nameIt: text("name_it").notNull(),
  circuit: text("circuit").notNull(),
  circuitIt: text("circuit_it").notNull(),
  country: text("country").notNull(),
  countryIt: text("country_it").notNull(),
  countryCode: text("country_code").notNull(),
  date: text("date").notNull(), // ISO date string YYYY-MM-DD
  season: integer("season").notNull().default(2026),
  trackImage: text("track_image"),
  officialResultsUrl: text("official_results_url"),
  status: text("status", {
    enum: ["scheduled", "postponed", "cancelled", "rescheduled"],
  })
    .notNull()
    .default("scheduled"),
  newDate: text("new_date"), // For rescheduled races
  isResultConfirmed: integer("is_result_confirmed", { mode: "boolean" })
    .notNull()
    .default(false),
});

export const teams = sqliteTable("teams", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  fullName: text("full_name").notNull(),
  manufacturer: text("manufacturer", {
    enum: ["Ducati", "Aprilia", "KTM", "Yamaha", "Honda"],
  }).notNull(),
  color: text("color").notNull(),
  season: integer("season").notNull().default(2026),
  isFactory: integer("is_factory", { mode: "boolean" }).notNull().default(false),
});

export const riders = sqliteTable("riders", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  number: integer("number").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id),
  nationality: text("nationality").notNull(),
  isWildcard: integer("is_wildcard", { mode: "boolean" })
    .notNull()
    .default(false),
  imageUrl: text("image_url"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  season: integer("season").notNull().default(2026),
});

export const predictions = sqliteTable("predictions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  raceId: text("race_id")
    .notNull()
    .references(() => races.id, { onDelete: "cascade" }),
  position1RiderId: text("position_1_rider_id")
    .notNull()
    .references(() => riders.id),
  position2RiderId: text("position_2_rider_id")
    .notNull()
    .references(() => riders.id),
  position3RiderId: text("position_3_rider_id")
    .notNull()
    .references(() => riders.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const raceResults = sqliteTable("race_results", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  raceId: text("race_id")
    .notNull()
    .unique()
    .references(() => races.id, { onDelete: "cascade" }),
  position1RiderId: text("position_1_rider_id")
    .notNull()
    .references(() => riders.id),
  position2RiderId: text("position_2_rider_id")
    .notNull()
    .references(() => riders.id),
  position3RiderId: text("position_3_rider_id")
    .notNull()
    .references(() => riders.id),
  confirmedAt: integer("confirmed_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  confirmedBy: text("confirmed_by").references(() => users.id),
});

export const scores = sqliteTable("scores", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  raceId: text("race_id")
    .notNull()
    .references(() => races.id, { onDelete: "cascade" }),
  points: real("points").notNull().default(0),
  position1Points: real("position_1_points").notNull().default(0),
  position2Points: real("position_2_points").notNull().default(0),
  position3Points: real("position_3_points").notNull().default(0),
  calculatedAt: integer("calculated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ===== TYPE EXPORTS =====
export type User = typeof users.$inferSelect;
export type Race = typeof races.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Rider = typeof riders.$inferSelect;
export type Prediction = typeof predictions.$inferSelect;
export type RaceResult = typeof raceResults.$inferSelect;
export type Score = typeof scores.$inferSelect;
export type InvitationCode = typeof invitationCodes.$inferSelect;
