import { eq, and } from 'drizzle-orm';

import { db } from '@/db';
import {
  accounts,
  users,
  userProfiles,
  type ExtendedAdapterAccountType,
  type SelectAccount,
  type SelectUser,
  type SelectUserProfile,
} from '@/db/schema';

export const selectUserByEmail = async (email: SelectUser['email']) => {
  const [result] = await db.select().from(users).where(eq(users.email, email));
  // console.log(`selectUserByEmail: ${JSON.stringify(result[0])}`);

  return result ?? null;
};

export const selectUserById = async (userId: SelectUser['id']) => {
  const [result] = await db.select().from(users).where(eq(users.id, userId));
  // console.log(`selectUserById: ${JSON.stringify(result[0])}`);

  return result ?? null;
};

export const selectAccountByUserIdWhereProvider = async (
  userId: SelectAccount['userId'],
  provider: ExtendedAdapterAccountType,
) => {
  const [result] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, provider)));
  // console.log(`existingUser: ${JSON.stringify(result[0])}`);

  return result ?? null;
};

export const selectUserWithAccountsByEmail = async (
  email: SelectUser['email'],
) => {
  const result = await db.query.users.findFirst({
    where: eq(users.email, email),
    with: {
      accounts: true, // if 1:1 or you want all of the accounts for 1:many
      // accounts: {
      //   where: eq(accounts.provider, 'credentials'),
      // }, // if 1(user):many(accounts)
    },
  });

  // console.log('selectUserWithAccountsByEmail=====>', result);

  return result ?? null;
};

export const selectUserWithSpecificAccountByEmail = async (
  email: SelectUser['email'],
  provider: SelectAccount['provider'],
) => {
  const result = await db.query.users.findFirst({
    where: eq(users.email, email),
    with: {
      // accounts: true, // if 1:1 or you want all of the accounts for 1:many
      accounts: {
        where: eq(accounts.provider, provider),
      }, // if 1(user):many(accounts)
    },
  });

  // console.log('selectUserWithSpecificAccountByEmail=====>', result);

  return result ?? null;
};

export const selectUserWithProfileByUserId = async (
  userId: SelectUser['id'],
) => {
  const result = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      profile: true,
    },
  });

  return result ?? null;
};

export const selectProfileWithUserByUserId = async (
  userId: SelectUserProfile['userId'],
) => {
  const result = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
    with: {
      user: true,
    },
  });

  return result ?? null;
};
