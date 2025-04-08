import { eq, and, sql, isNull } from 'drizzle-orm';

import { db } from '@/db';
import {
  employments,
  joinRequests,
  memberships,
  type SelectEmployment,
  type SelectJoinRequest,
  type SelectMembership,
} from '@/db/schema';
import { nullIfEmptyArrOrStr } from '@/utils';

export const delJoinReq = async ({
  userId,
  groupId,
}: {
  userId: SelectJoinRequest['userId'];
  groupId: SelectJoinRequest['groupId'];
}) => {
  const [result] = await db
    .delete(joinRequests)
    .where(
      and(eq(joinRequests.userId, userId), eq(joinRequests.groupId, groupId)),
    )
    .returning();

  return result ?? null;
};

export const delUnevaluatedJoinReq = async ({
  userId,
  groupId,
}: {
  userId: SelectJoinRequest['userId'];
  groupId: SelectJoinRequest['groupId'];
}) => {
  const [result] = await db
    .delete(joinRequests)
    .where(
      and(
        eq(joinRequests.userId, userId),
        eq(joinRequests.groupId, groupId),
        isNull(joinRequests.confirmed), // only unevaluated
      ),
    )
    .returning();
  return result ?? null;
};

export const deleteMembershipById = async ({
  userId,
  groupId,
}: {
  userId: SelectMembership['userId'];
  groupId: SelectMembership['groupId'];
}) => {
  const [result] = await db
    .delete(memberships)
    .where(
      and(eq(memberships.userId, userId), eq(memberships.groupId, groupId)),
    )
    .returning();
  return result ?? null;
};

// export const deleteMembershipsByIds = async ({
//   userIds,
//   groupId,
// }: {
//   userIds: Array<SelectMembership['userId']>;
//   groupId: SelectMembership['groupId'];
// }) => {
//   // const query = db
//   //   .delete(memberships)
//   //   .where(
//   //     sql`${memberships.userId} IN ${userIds} AND ${memberships.groupId}=${groupId}`,
//   //   )
//   //   .returning()
//   //   .toSQL();

//   // console.log('query check ====>', query);

//   const result = await db
//     .delete(memberships)
//     .where(
//       sql`${memberships.userId} IN ${userIds} AND ${memberships.groupId}=${groupId}`,
//     )
//     .returning();

//   return nullIfEmptyArrOrStr(result);
// };

export const deleteEmploymentsByIds = async ({
  userIds,
  groupId,
}: {
  userIds: Array<SelectEmployment['userId']>;
  groupId: SelectEmployment['groupId'];
}) => {
  const result = await db
    .delete(employments)
    .where(
      sql`${employments.userId} IN ${userIds} AND ${employments.groupId}=${groupId}`,
    )
    .returning();

  return nullIfEmptyArrOrStr(result);
};
