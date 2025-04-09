import { eq, and, sql } from 'drizzle-orm';

import { db } from '@/db';
import {
  accounts,
  groups,
  // groupSessions,
  joinRequests,
  users,
  type ExtendedAdapterAccountType,
  type SelectAccount,
  type SelectGroup,
  // type SelectGroupSession,
  type SelectJoinRequest,
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

export const selectUsersByIds = async (userIds: Array<SelectUser['id']>) => {
  try {
    // const query = db
    //   .select()
    //   .from(users)
    //   .where(sql`${users.id} IN ${userIds}`)
    //   .toSQL();
    // console.log('query check ====>', query);

    const result = await db
      .select()
      .from(users)
      .where(sql`${users.id} IN ${userIds}`);

    // console.log('query result =======>', result);

    return nullIfEmptyArrOrStr(result);
  } catch (error) {
    console.error(error);
  }
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

export const selectGroupById = async (id: SelectGroup['id']) => {
  const [result] = await db.select().from(groups).where(eq(groups.id, id));
  return result;
};

export const selJoinRequest = async (userId: SelectJoinRequest['userId']) => {
  const [result] = await db
    .select()
    .from(joinRequests)
    .where(eq(joinRequests.userId, userId));

  return result;
};

// not yet used
// export const selGroupSessionById = async (id: SelectGroupSession['id']) => {
//   const [result] = await db
//     .select()
//     .from(groupSessions)
//     .where(eq(groupSessions.id, id));

//   return result;
// };
