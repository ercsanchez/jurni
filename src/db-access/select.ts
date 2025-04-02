import { eq, and } from 'drizzle-orm';

import { db } from '@/db';
import {
  accounts,
  groups,
  users,
  userProfiles,
  type ExtendedAdapterAccountType,
  type SelectAccount,
  type SelectGroup,
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

  // findFirst returns undefined if no match
  return result;
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
  // findFirst returns undefined if no match
  return result;
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

  // findFirst returns undefined if no match
  return result;
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

  // findFirst returns undefined if no match
  return result;
};

export const selectAllGroups = async () => {
  const result = await db.select().from(groups);
  return result.length > 0 ? result : null;
};

// should only return 1 group because name is unique
export const selectGroupByName = async (name: SelectGroup['name']) => {
  const [result] = await db.select().from(groups).where(eq(groups.name, name));
  return result;
};

interface WithOwner {
  with: {
    owner?: true;
  };
}

export const queryFindGroupByIdWithOwner = async ({
  id,
  withOwner = true,
}: {
  id: SelectGroup['id'];
  withOwner?: boolean;
}) => {
  const conditionalQueryProps: WithOwner | object = withOwner
    ? { with: { owner: true } }
    : {};
  // - OR -
  // const conditionalQueryProps: undefined | { with: { owner?: true } } =
  //   withOwner ? { with: { owner: true } } : undefined;

  const result = await db.query.groups.findFirst({
    where: eq(groups.id, id),
    // with: {
    //   owner: true,
    // },
    ...conditionalQueryProps,
    // - OR -
    // ...(withOwner && { with: { owner: true } }),
    // - OR -
    // ...(withOwner ? { with: { owner: true } } : {}),
  });

  // findFirst returns undefined if no match
  return result;
};

export const queryFindGroupsByOwnerId = async (
  ownerId: SelectGroup['ownerId'],
) => {
  const result = await db.query.groups.findMany({
    where: eq(groups.ownerId, ownerId),
  });

  // findMany returns array w/c is empty if none found
  return result.length > 0 ? result : null;
};

export const queryFindUserByIdWithOwnedGroups = async (
  userId: SelectUser['id'],
) => {
  const result = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      ownedGroups: true,
    },
  });

  // findFirst returns undefined if no match
  return result;
};

export const queryFindGroupsByOwnerIdWithOwner = async (
  ownerId: SelectGroup['ownerId'],
) => {
  const result = await db.query.groups.findMany({
    where: eq(groups.ownerId, ownerId),
    with: {
      owner: true,
    },
  });

  // findMany returns array w/c is empty if none found
  return result.length > 0 ? result : null;
};
