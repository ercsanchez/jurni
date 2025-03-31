import {
  // boolean,
  // foreignKey,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { relations } from 'drizzle-orm';

import type { AdapterAccountType } from 'next-auth/adapters';

export type ExtendedAdapterAccountType = AdapterAccountType | 'credentials';

export const users = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
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
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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

    // this change may affect next-auth in some other way so check this!!!
    primaryKey({ columns: [account.userId, account.provider] }),
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
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),

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

// groups
// groupSessions

// userGroupMemberships
// userGroupCheckins

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export type InsertAccount = typeof accounts.$inferInsert;
export type SelectAccount = typeof accounts.$inferSelect;

export type InsertUserProfile = typeof userProfiles.$inferInsert;
export type SelectUserProfile = typeof userProfiles.$inferSelect;

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
