import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import {
  groups,
  groupSessions,
  joinRequests,
  memberCheckins,
  users,
  type SelectGroup,
  type SelectGroupSession,
  type SelectJoinRequest,
  type SelectMemberCheckin,
  type SelectUser,
} from '@/db/schema';
import { nullIfEmptyArrOrStr, queryDataWithBigintToStr } from '@/utils';

// updates emailVerified and name
export const upUser = async ({
  userId,
  verifyEmail,
  name,
}: {
  userId: SelectUser['id'];
  verifyEmail?: boolean;
  name?: SelectUser['name'];
}) => {
  const data = {
    name: name ? name : undefined,
    emailVerified: verifyEmail ? new Date() : undefined,
  };

  const [result] = await db
    .update(users)
    .set(data)
    .where(eq(users.id, userId))
    .returning({ id: users.id, email: users.email, name: users.name });

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

export const upGroup = async ({
  id,
  ownedBy,
  name,
  slug,
}: {
  id: SelectGroup['id'];
  ownedBy: SelectGroup['ownedBy'];
  name?: SelectGroup['name'];
  slug?: SelectGroup['slug'];
}) => {
  const [result] = await db
    .update(groups)
    .set({ name, slug })
    .where(and(eq(groups.ownedBy, ownedBy), eq(groups.id, id)))
    .returning({
      id: groups.id,
      name: groups.name,
      ownedBy: groups.ownedBy,
      slug: groups.slug,
    });

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

export const upMemberCheckins = async ({
  ids,
  confirmed,
  confirmedBy,
}: {
  ids: Array<SelectMemberCheckin['id']>;
  confirmed?: SelectMemberCheckin['confirmed'];
  confirmedBy?: SelectMemberCheckin['confirmedBy'];
  // groupId: SelectMemberCheckin['groupId'];
  // sessionId: SelectMemberCheckin['sessionId']; // doesnt seem to be needed since we already use the member checkin id
  // createdAt?: string;
}) => {
  const confirmationData = Object.is(confirmed, null)
    ? { confirmed: null, confirmedBy: null, confirmedAt: null }
    : typeof confirmed === 'boolean'
      ? {
          confirmed,
          confirmedBy,
          confirmedAt: new Date(),
        }
      : {}; // confirmed is undefined

  // do not allow editing of createdAt data
  // const tzOffset = timezoneOffset ?? DEFAULT_TIMEZONE_OFFSET;
  // const createdAtDateObj = createdAt ? new Date(createdAt) : undefined;
  // const createdLocalDateISOString = createdAtDateObj
  //   ? getShiftedDateISOStringGivenTz(tzOffset, createdAtDateObj)
  //   : undefined;
  // const creationData = createdAt
  //   ? { createdAt: createdAtDateObj, createdDate: createdLocalDateISOString }
  //   : {};

  const queryResult = await db
    .update(memberCheckins)
    // .set({ ...confirmationData, ...creationData, ...rest })
    .set({ ...confirmationData })
    .where(sql`${memberCheckins.id} IN ${ids}`)
    .returning();

  // memberCheckin id is a bigint so needs to be converted to string
  const result = queryDataWithBigintToStr(queryResult, 'id');
  // - or -
  // const result = q.map((i) => ({ ...i, id: i.id.toString() }));

  return nullIfEmptyArrOrStr(result);
};
