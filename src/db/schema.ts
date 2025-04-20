import { relations } from 'drizzle-orm';
import {
  bigint,
  bigserial,
  boolean,
  date,
  // foreignKey,
  // index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import type { AdapterAccountType } from 'next-auth/adapters';

import {
  DAY_NAMES,
  DEFAULT_TIMEZONE_OFFSET,
  EMPLOYEE_ROLES,
} from '@/config/constants';

export type ExtendedAdapterAccountType = AdapterAccountType | 'credentials';

export const users = pgTable('user', {
  // id: bigserial('id', { mode: 'number' }) // drizzle adapter error because expects a vrchar/text/uuid type
  id: varchar('id', { length: 7 })
    .primaryKey()
    .$defaultFn(() => nanoid(7)),
  name: varchar('name', { length: 64 }),
  email: varchar('email', { length: 128 }).unique().notNull(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'), // delete this and create one for userProfile
  password: varchar('password', { length: 256 }),

  // fix for referencing userProfile by profileId:
  // profileId: text('profileId'),
});

// next-auth does not allow user to signin with OAuth if already signed in with credentials | [auth][error] OAuthAccountNotLinked: Another account already exists with the same e-mail address. Read more at https://errors.authjs.dev#oauthaccountnotlinked
//     at handleLoginOrRegister (webpack-internal:///(rsc)/./node_modules/@auth/core/lib/actions/callback/handle-login.js:256:23)

export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  profile: one(userProfiles),
  ownedGroups: many(groups, { relationName: 'ownership' }),
  joinRequests: many(joinRequests),
  memberships: many(memberships),
  employments: many(employments),

  // this doesn't work because users doesn't have a field profileId that references userProfile.id | per drizzle docs: https://orm.drizzle.team/docs/relations#foreign-keys

  // profile: one(users, {
  //   fields: [userProfiles.userId],
  //   references: [users.id],
  // }),

  // fix for referencing userProfile by profileId:
  // profile: one(userProfiles, {
  //   fields: [users.profileId],
  //   references: [userProfiles.id],
  // }),
}));

// quick fix: don't create an account if credentials and assume that if there is no account, user signed in with credentials, then try signing in with oauth

// export const usersRelations = relations(users, ({ one }) => ({
//   accounts: one(accounts),
// }));

export const accounts = pgTable(
  'account',
  {
    // id: text('id')
    //   .primaryKey()
    //   .$defaultFn(() => crypto.randomUUID()),
    userId: varchar('userId', { length: 7 }) // do not use 'user_id' as the name as it will yield errors with the next-auth drizzle adapter
      .notNull(),
    // .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<ExtendedAdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    // per next-auth / drizzle docs:
    // primaryKey({ columns: [account.provider, account.providerAccountId] }),

    // account.providerAccountId may be null or empty '' so better to use user id, since user can only have one account per provider

    // TODO: this change may affect next-auth in some other way so check this!!!
    primaryKey({ columns: [account.userId, account.provider] }),

    // prevent duplication of the same oauth acct (user signs in via oauth, changes user.email, then registers another user with the same oauth acct)
    unique().on(account.provider, account.providerAccountId),

    // foreignKey({
    //   name: 'user_fk',
    //   columns: [account.userId],
    //   foreignColumns: [users.id],
    // })
    //   .onDelete('cascade')
    //   .onUpdate('cascade'),
  ],

  // this is the old way | cannot delete account in the db | only deleted when deleting the user | drizzle-kit studio error please add a primary key column to your table to update or delete rows
  // (account) => [
  //   {
  //     compoundKey: primaryKey({
  //       columns: [account.provider, account.providerAccountId],
  //     }),
  //   },
  // ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const userProfiles = pgTable(
  'user_profile',
  {
    userId: varchar('user_id', { length: 7 }).primaryKey(),
    // .references(() => users.id, { onDelete: 'cascade' }),
    firstName: varchar('first_name', { length: 64 }).notNull(),
    middleName: varchar('middle_name', { length: 64 }).notNull(),
    lastName: varchar('last_name', { length: 64 }).notNull(),
  },

  // Alternative foreign key implementation if not using userId: .references(() => users.id, { onDelete: 'cascade' })
  // (userProfiles) => [
  //   foreignKey({
  //     name: 'user_fk',
  //     columns: [userProfiles.userId],
  //     foreignColumns: [users.id],
  //   })
  //     .onDelete('cascade')
  //     .onUpdate('cascade'),
  // ],
);

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, { fields: [userProfiles.userId], references: [users.id] }),

  // doesn't work | child relation needs to indicate what parent field will be referenced by the child | [Error: There is not enough information to infer relation "userProfiles.user"]
  // user: one(users),
}));

export const groups = pgTable('group', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  // slug:
  ownedBy: varchar('owned_by', { length: 7 }).notNull(),
  // .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 256 }).notNull().unique(),
  defaultTimezoneOffset: varchar('default_timezone_offset', { length: 6 })
    .notNull()
    .default(DEFAULT_TIMEZONE_OFFSET),

  // TODO: slug that will be used as a url path param
  // TODO: add createdBy & createdAt
});

export const groupsRelations = relations(groups, ({ one, many }) => ({
  owner: one(users, {
    fields: [groups.ownedBy],
    references: [users.id],
    relationName: 'ownership',
  }),
  joinRequests: many(joinRequests),
  memberships: many(memberships),
  employments: many(employments),
  groupSessions: many(groupSessions),
  memberCheckins: many(memberCheckins),
}));

export const dayEnum = pgEnum(
  'day',
  DAY_NAMES,
  // DAY_NAMES as unknown as readonly [string, ...string[]], // no need since DAY_NAMES already typecast to const
);

export const groupSessions = pgTable(
  'group_session',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    groupId: bigint('group_id', { mode: 'number' }).notNull(),
    name: varchar('name', { length: 256 }).notNull(), // should not be unique so that multiple sessions w/ same name but different day/times
    day: dayEnum().notNull(),

    // TODO: this might be an issue later since checkin time is in UTC
    // store actual time in group's timezone (local time)
    startAt: time('start_at', { precision: 0 }).notNull(), // no need for withTimezone: true, since already stored info separately
    endAt: time('end_at', { precision: 0 }).notNull(),
    timezoneOffset: varchar('timezone_offset', { length: 6 })
      .notNull()
      .default(DEFAULT_TIMEZONE_OFFSET),

    createdBy: varchar('created_by', { length: 7 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date', precision: 0 })
      .notNull()
      .defaultNow(),
    lastEditedAt: timestamp('last_edited_at', { mode: 'date', precision: 0 }),
    active: boolean().notNull().default(false), // to enable/disable members to check in

    // remarks: inactive, cancelled/discontinued
  },

  // should not use composite primary key so that multiple sessions w/ same name but different day/times
  // (table) => [primaryKey({ columns: [table.groupId, table.name] })],

  // using a composite primary key to enforce a unique constraint on multiple fields, would mean you would have to pass the primary key fields, everytime when querying the relation
  // better to define the unique constraint separately
  (table) => [
    unique().on(
      table.groupId,
      table.name,
      table.day,
      table.startAt,
      table.endAt,
      table.timezoneOffset,
    ),
  ],
);

export const groupSessionsRelations = relations(groupSessions, ({ one }) => ({
  group: one(groups, {
    fields: [groupSessions.groupId],
    references: [groups.id],
  }),
}));

export const joinRequests = pgTable(
  'join_request',
  {
    groupId: bigint('group_id', { mode: 'number' }).notNull(),
    userId: varchar('user_id', { length: 7 }).notNull(),
    invitedBy: varchar('invited_by', { length: 7 }),
    confirmed: boolean(),
    evaluatedBy: varchar('evaluated_by', { length: 7 }),
    evaluatedAt: timestamp('evaluated_at', { mode: 'date', precision: 0 }),

    // createdBy: varchar('created_by', { length: 7 }).notNull(), // only user can create a join request
    createdAt: timestamp('created_at', { mode: 'date', precision: 0 })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.groupId, table.userId] })],
);

// join request confirmed: joinRequest will be deleted and membership will be created
// join request rejected: confirmed=false & evaluatedBy has a value
// if evaluatedBy or confirmed is null, join request has not yet been evaluated

// add invitedBy, invitedAt
// payment and attendace confirmation requests could be placed here

export const joinRequestsRelations = relations(joinRequests, ({ one }) => ({
  group: one(groups, {
    fields: [joinRequests.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [joinRequests.userId],
    references: [users.id],
  }),

  // membership: one(memberships),
}));

export const memberships = pgTable(
  'membership',
  {
    groupId: bigint('group_id', { mode: 'number' }).notNull(),
    userId: varchar('user_id', { length: 7 }).notNull(),
    invitedBy: varchar('invited_by', { length: 7 }),
    createdBy: varchar('created_by', { length: 7 }).notNull(), // should be the same value as joinRequests.evaluatedBy
    createdAt: timestamp('created_at', { mode: 'date', precision: 0 })
      .notNull()
      .defaultNow(),

    // dont use this | better to have table for status changes
    // lastEditedAt: timestamp('last_edited_at', { mode: 'date', precision: 0 }),
    // lastEditedBy: varchar('last_edited_by', { length: 7 }),
  },
  (table) => [primaryKey({ columns: [table.groupId, table.userId] })],
);

// payment status: current, past-due
// member status: active (at least 1 checkin in the last 30 days), inactive (cron job based on no checkins for the last 30 days), banned (user cannot rejoin until unbanned), cancelled (user or employee initiated )
// remarks:

// invitedBy, evaluatedBy or createdBy - data carried over from member requests

// better if requests are on a separate table coz we will also have a status field for members (banned, active, inactive, injured) | we dont want to do too much filtering

export const membershipsRelations = relations(memberships, ({ one }) => ({
  group: one(groups, {
    fields: [memberships.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
  // checkins: many(memberCheckins),
  // joinRequest: one(joinRequests, {
  //   fields: [memberships.userId, memberships.groupId],
  //   references: [joinRequests.userId, joinRequests.groupId],
  // }),
}));

// req'd inputs: groupId, userId, sessionId, date, createdBy, confirmedBy?, confirmedAt?
export const memberCheckins = pgTable(
  'member_checkin',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),

    // membership relation
    groupId: bigint('group_id', { mode: 'number' }).notNull(),
    userId: varchar('user_id', { length: 7 }).notNull(),

    // session relation
    sessionId: bigint('session_id', { mode: 'number' }).notNull(),

    // actual date using the related session's timezone offset | needed to ensure only unique checkin per member per session per day
    date: date('date', { mode: 'string' }).notNull(), // needs date iso string as the input value | if using mode: 'date', => "TypeError: value.toISOString is not a function" if you don't pass a js date object as the value

    createdAt: timestamp('created_at', {
      mode: 'date',
      // withTimezone: true, // no need for timezone, since js dates are always generated and saved in UTC and its difficult to convert it with a tz offset
      precision: 0,
    })
      .notNull()
      .defaultNow(), // TODO: generate the date from the drizzle query func so that createdDate and createdAt uses the same date obj?

    createdBy: varchar('created_by', { length: 7 }).notNull(),

    confirmed: boolean(),
    confirmedBy: varchar('confirmed_by', { length: 7 }),
    confirmedAt: timestamp('confirmed_at', { mode: 'date', precision: 0 }),

    // TODO: add fields lastEditedBy
  },
  (table) => [
    // primarily used to ensure member can only check in once for any session per day | member can still check in to different sessions in a day
    // no need to include groupId, since sessionId is unique
    // primaryKey({
    //   columns: [table.sessionId, table.userId, table.date],
    // }),

    unique().on(table.sessionId, table.userId, table.date).nullsNotDistinct(),

    // need this for queries filering by groupId, then session, and period (date)
    // filtering by group and period will always occur (since we don't want to query all checkins from the beg)
    // pk is insufficient for queries where group

    // TODO: query is faster with the
    // catch all for
    // index('member_checkin_group_id_session_id_user_id_date_idx').on(
    //   table.groupId,
    //   table.sessionId,
    //   table.userId,
    //   table.date,
    // ),

    // query by group and/or session (date will almost always be part of filter)
    // index('member_checkin_group_id_session_id_date_idx').on(
    //   table.groupId,
    //   table.sessionId,
    //   table.date,
    // ),

    // query by group and/or user (date will almost always be part of filter)
    // index('member_checkin_group_id_user_id_date_idx').on(
    //   table.groupId,
    //   table.userId,
    //   table.date,
    // ),
  ],
);

export const memberCheckinsRelations = relations(memberCheckins, ({ one }) => ({
  group: one(groups, {
    fields: [memberCheckins.groupId],
    references: [groups.id],
  }),

  // TODO: do i need these? only useful if we use query memberCheckins with relation
  // user: one(users, {
  //   fields: [memberCheckins.userId],
  //   references: [users.id],
  // }),
  // groupSession: one(groupSessions, {
  //   fields: [memberCheckins.sessionId],
  //   references: [groupSessions.id],
  // }),
  // member: one(memberships, {
  //   fields: [memberCheckins.groupId, memberCheckins.userId],
  //   references: [memberships.groupId, memberships.userId],
  // }),
}));

// employment status: active, inactive, banned, resigned, terminated
// remarks: terminated, resigned, on leave, etc.

export const employeeRoleEnum = pgEnum(
  'employee_role',
  EMPLOYEE_ROLES,
  // DAY_NAMES as unknown as readonly [string, ...string[]], // no need since DAY_NAMES already typecast to const
);

export const employments = pgTable(
  'employment',
  {
    groupId: bigint('group_id', { mode: 'number' }).notNull(),
    userId: varchar('user_id', { length: 7 }).notNull(),
    role: employeeRoleEnum().notNull().default('employee'),
    createdBy: varchar('created_by', { length: 7 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date', precision: 0 })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.groupId, table.userId] })],
);

// employment status: active, inactive, banned, resigned, terminated
// remarks: terminated, resigned, on leave, etc.

export const employmentsRelations = relations(employments, ({ one }) => ({
  group: one(groups, {
    fields: [employments.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [employments.userId],
    references: [users.id],
  }),
}));

// userGroupCheckins

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export type InsertAccount = typeof accounts.$inferInsert;
export type SelectAccount = typeof accounts.$inferSelect;

export type InsertUserProfile = typeof userProfiles.$inferInsert;
export type SelectUserProfile = typeof userProfiles.$inferSelect;

export type InsertGroup = typeof groups.$inferInsert;
export type SelectGroup = typeof groups.$inferSelect;

export type InsertGroupSession = typeof groupSessions.$inferInsert;
export type SelectGroupSession = typeof groupSessions.$inferSelect;

export type InsertJoinRequest = typeof joinRequests.$inferInsert;
export type SelectJoinRequest = typeof joinRequests.$inferSelect;

export type InsertMembership = typeof memberships.$inferInsert;
export type SelectMembership = typeof memberships.$inferSelect;

export type InsertMemberCheckin = typeof memberCheckins.$inferInsert;
export type SelectMemberCheckin = typeof memberCheckins.$inferSelect;

export type InsertEmployment = typeof employments.$inferInsert;
export type SelectEmployment = typeof employments.$inferSelect;

// REQUIRED SCHEMAS FOR NEXT-AUTH DB SESSION STRATEGY

// export const sessions = pgTable('session', {
//   sessionToken: text('sessionToken').primaryKey(),
//   userId: text('userId')
//     .notNull()
//     .references(() => users.id, { onDelete: 'cascade' }),
//   expires: timestamp('expires', { mode: 'date' }).notNull(),
// });

// export const verificationTokens = pgTable(
//   'verificationToken',
//   {
//     identifier: text('identifier').notNull(),
//     token: text('token').notNull(),
//     expires: timestamp('expires', { mode: 'date' }).notNull(),
//   },
//   (verificationToken) => [
//     {
//       compositePk: primaryKey({
//         columns: [verificationToken.identifier, verificationToken.token],
//       }),
//     },
//   ],
// );

// export const authenticators = pgTable(
//   'authenticator',
//   {
//     credentialID: text('credentialID').notNull().unique(),
//     userId: text('userId')
//       .notNull()
//       .references(() => users.id, { onDelete: 'cascade' }),
//     providerAccountId: text('providerAccountId').notNull(),
//     credentialPublicKey: text('credentialPublicKey').notNull(),
//     counter: integer('counter').notNull(),
//     credentialDeviceType: text('credentialDeviceType').notNull(),
//     credentialBackedUp: boolean('credentialBackedUp').notNull(),
//     transports: text('transports'),
//   },
//   (authenticator) => [
//     {
//       compositePK: primaryKey({
//         columns: [authenticator.userId, authenticator.credentialID],
//       }),
//     },
//   ],
// );
