import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import {
  groups,
  groupSessions,
  joinRequests,
  users,
  type SelectGroup,
  type SelectGroupSession,
  type SelectJoinRequest,
  type SelectUser,
} from '@/db/schema';
import { nullIfEmptyArrOrStr } from '@/utils';

export const updateUserEmailVerified = async (userId: SelectUser['id']) => {
  const [result] = await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.id, userId))
    .returning({ id: users.id, email: users.email });

  return result ?? null;
};

export const updateUserPassword = async (
  userId: SelectUser['id'],
  hashedPword: SelectUser['password'],
) => {
  const [result] = await db
    .update(users)
    .set({ password: hashedPword })
    .where(eq(users.id, userId))
    .returning({ id: users.id, email: users.email });

  return result ?? null;
};

export const updateGroup = async ({
  id,
  ownerId,
  name,
}: {
  id: SelectGroup['id'];
  ownerId: SelectGroup['ownerId'];
  name: SelectGroup['name'];
}) => {
  const [result] = await db
    .update(groups)
    .set({ name: name })
    .where(and(eq(groups.ownerId, ownerId), eq(groups.id, id)))
    .returning({ id: groups.id, name: groups.name, ownerId: groups.ownerId });

  return result ?? null;
};

export const updateJoinRequests = async (data: {
  userIds: Array<SelectJoinRequest['userId']>;
  groupId: SelectJoinRequest['groupId'];
  confirmed: SelectJoinRequest['confirmed'];
  evaluatedBy: SelectJoinRequest['evaluatedBy'];
}) => {
  const { userIds, groupId, evaluatedBy, confirmed, ...rest } = data;
  // const evaluatedAt = new Date(Date.now());

  const evaluationData = Object.is(confirmed, null)
    ? { confirmed: null, evaluatedBy: null, evaluatedAt: null }
    : { confirmed, evaluatedBy, evaluatedAt: new Date(Date.now()) };

  const result = await db
    .update(joinRequests)
    .set({ ...evaluationData, ...rest })
    .where(
      sql`${joinRequests.userId} IN ${userIds} AND ${eq(joinRequests.groupId, groupId)}`,
    )
    .returning();

  return nullIfEmptyArrOrStr(result);
};

export const updateGroupSession = async (data: {
  id: SelectGroupSession['id'];
  name: SelectGroupSession['name'];
  active: SelectGroupSession['active'];
}) => {
  const { id, ...rest } = data;

  const lastEditedAt = new Date();

  const [result] = await db
    .update(groupSessions)
    .set({ ...rest, lastEditedAt })
    .where(eq(groupSessions.id, id))
    .returning();

  return result;
};
