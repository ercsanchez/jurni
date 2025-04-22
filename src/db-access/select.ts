import { and, asc, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import {
  accounts,
  groups,
  // groupSessions,
  joinRequests,
  memberCheckins,
  memberships,
  users,
  userProfiles,
  type ExtendedAdapterAccountType,
  type SelectAccount,
  type SelectGroup,
  // type SelectGroupSession,
  type SelectJoinRequest,
  type SelectMemberCheckin,
  type SelectMembership,
  type SelectUser,
  // type SelectUserProfile,
} from '@/db/schema';
import { nullIfEmptyArrOrStr } from '@/utils';

export const selUserByEmail = async (email: SelectUser['email']) => {
  const [result] = await db.select().from(users).where(eq(users.email, email));
  // console.log(`selUserByEmail: ${JSON.stringify(result[0])}`);

  return result ?? null;
};

export const selUserById = async (id: SelectUser['id']) => {
  const [result] = await db.select().from(users).where(eq(users.id, id));
  // console.log(`selUserById: ${JSON.stringify(result[0])}`);

  return result ?? null;
};

export const selUserByName = async (name: SelectUser['name']) => {
  const [result] = await db
    .select()
    .from(users)
    .where(sql`${users.name}=${name}`);

  // .where(eq(users.name, name)); // ts error because some name values will be null
  // .where(sql`${users.name} IS NOT  NULL AND ${users.name}=${name}`); // no need to filter out non null values

  console.log('result ====>', result);

  return result ?? null;
};

export const selUsersByIds = async (userIds: Array<SelectUser['id']>) => {
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

export const selAccountByUserIdWhereProvider = async (
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

export const selAllGroups = async () => {
  const result = await db.select().from(groups);
  return nullIfEmptyArrOrStr(result) as Array<object> | null;
};

// should only return 1 group because name is unique
export const selGroupByName = async ({
  name,
}: {
  name: SelectGroup['name'];
}) => {
  const [result] = await db.select().from(groups).where(eq(groups.name, name));
  return result;
};

// export const selGroupById = async (id: SelectGroup['id']) => {
//   const [result] = await db.select().from(groups).where(eq(groups.id, id));
//   return result;
// };

export const selGroupBySlug = async (slug: SelectGroup['slug']) => {
  const [result] = await db.select().from(groups).where(eq(groups.slug, slug));
  return result;
};

export const selJoinRequest = async (userId: SelectJoinRequest['userId']) => {
  const [result] = await db
    .select()
    .from(joinRequests)
    .where(eq(joinRequests.userId, userId));

  return result;
};

export const selMembershipsByUserIdsGroupId = async ({
  userIds,
  groupId,
}: {
  userIds: Array<SelectMembership['userId']>;
  groupId: SelectMembership['groupId'];
}) => {
  const result = await db
    .select()
    .from(memberships)
    .where(
      // and(eq(memberships.userId, userId), eq(memberships.groupId, groupId)),
      // sql`${memberships.userId} IN ${userIds} AND ${memberships.groupId}=${groupId}`,
      and(
        sql`${memberships.userId} IN ${userIds}`,
        eq(memberships.groupId, groupId),
      ),
    );

  return nullIfEmptyArrOrStr(result);
};

export const selMemberCheckinsByGrpIdWherePeriodOrSessionIds = async ({
  groupId,
  begDate,
  endDate = begDate,
  sessionIds,
  orderBy = 'desc',
}: {
  groupId: SelectMemberCheckin['groupId'];
  begDate: SelectMemberCheckin['date'];
  endDate?: SelectMemberCheckin['date'];
  sessionIds?:
    | SelectMemberCheckin['sessionId']
    | Array<SelectMemberCheckin['sessionId']>;
  orderBy?: 'asc' | 'desc';
}) => {
  const queryResult = await db
    .select()
    .from(memberCheckins)
    .where(
      and(
        eq(memberCheckins.groupId, groupId),
        sql`${memberCheckins.date} BETWEEN ${begDate} AND ${endDate}`,

        // array or 1 string
        Array.isArray(sessionIds)
          ? sql`${memberCheckins.sessionId} IN ${sessionIds}`
          : typeof sessionIds === 'string'
            ? eq(memberCheckins.sessionId, sessionIds)
            : undefined,
      ),
    )
    .orderBy(
      orderBy === 'desc' ? desc(memberCheckins.date) : asc(memberCheckins.date),
    )
    .innerJoin(users, eq(memberCheckins.userId, users.id))
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId));

  const result = queryResult.map((q) => {
    q['member_checkin']['id'] = q['member_checkin'].id;
    return q;

    // - OR -
    // return {
    //   user: q.user,
    //   user_profile: q.user_profile,
    //   member_checkin: {
    //     ...q.member_checkin,
    //     id: q.member_checkin.id.toString(),
    //   },
    // };
  });

  return nullIfEmptyArrOrStr(result);
};

// not yet used
// export const selGroupSessionById = async (id: SelectGroupSession['id']) => {
//   const [result] = await db
//     .select()
//     .from(groupSessions)
//     .where(eq(groupSessions.id, id));

//   return result;
// };
