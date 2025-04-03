import { eq, and } from 'drizzle-orm';

import { db } from '@/db';
import {
  accounts,
  groups,
  users,
  type ExtendedAdapterAccountType,
  type SelectAccount,
  type SelectGroup,
  type SelectUser,
} from '@/db/schema';
import { nullIfEmptyArrOrStr } from '@/utils';

export const selectUserByEmail = async (email: SelectUser['email']) => {
  const [result] = await db.select().from(users).where(eq(users.email, email));
  // console.log(`selectUserByEmail: ${JSON.stringify(result[0])}`);

  return result ?? null;
};

export const selectUserById = async (id: SelectUser['id']) => {
  const [result] = await db.select().from(users).where(eq(users.id, id));
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

export const selectAllGroups = async () => {
  const result = await db.select().from(groups);
  return nullIfEmptyArrOrStr(result) as Array<object> | null;
};

// should only return 1 group because name is unique
export const selectGroupByName = async ({
  name,
}: {
  name: SelectGroup['name'];
}) => {
  const [result] = await db.select().from(groups).where(eq(groups.name, name));
  return result;
};
