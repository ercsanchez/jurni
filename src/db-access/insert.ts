import { DEFAULT_TIMEZONE_OFFSET } from '@/config/constants';
import { db } from '@/db';
import {
  accounts,
  employments,
  // groups,
  groupSessions,
  joinRequests,
  memberCheckins,
  // memberships,
  users,
  userProfiles,
  type InsertAccount,
  type InsertEmployment,
  // type InsertGroup,
  type InsertGroupSession,
  type InsertJoinRequest,
  type InsertMemberCheckin,
  // type InsertMembership,
  type InsertUser,
  type InsertUserProfile,
} from '@/db/schema';
import { getShiftedDateISOStringGivenTz, nullIfEmptyArrOrStr } from '@/utils';

export const insUser = async (newUser: InsertUser) => {
  const [result] = await db
    .insert(users)
    .values(newUser)
    .returning({ email: users.email, id: users.id });

  return result ?? null;
};

export const insAccount = async (newAccount: InsertAccount) => {
  const [result] = await db.insert(accounts).values(newAccount).returning({
    userId: accounts.userId,
    providerAccountId: accounts.providerAccountId,
    type: accounts.type,
    provider: accounts.provider,
  });

  return result ?? null;
};

export const insOrUpdateUserProfile = async (
  newUserProfile: InsertUserProfile,
) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { userId, ...rest } = newUserProfile;

  const [result] = await db
    .insert(userProfiles)
    .values(newUserProfile)
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: { ...rest },
    })
    .returning({
      userId: userProfiles.userId,
      firstName: userProfiles.firstName,
      middleName: userProfiles.middleName,
      lastName: userProfiles.lastName,
    });

  return result ?? null;
};

// export const insGroup = async (newGroup: InsertGroup) => {
//   const [result] = await db.insert(groups).values(newGroup).returning({
//     name: groups.name,
//     slug: groups.slug,
//     ownedBy: groups.ownedBy,
//   });

//   return result ?? null;
// };

export const insertJoinRequest = async (newJoinReq: InsertJoinRequest) => {
  const [result] = await db
    .insert(joinRequests)
    .values(newJoinReq)
    .onConflictDoNothing({
      target: [joinRequests.userId, joinRequests.groupId],
    })
    .returning({
      userId: joinRequests.userId,
      groupId: joinRequests.groupId,
    });

  return result ?? null;
};

// export const insertMemberships = async ({
//   userIds,
//   groupId,
//   createdBy,
// }: {
//   userIds: Array<InsertMembership['userId']>;
//   groupId: InsertMembership['groupId'];
//   createdBy: InsertMembership['createdBy'];
// }) => {
//   const newMemberships: Array<InsertMembership> = userIds.map((userId) => ({
//     userId,
//     groupId,
//     createdBy,
//   }));

//   const result = await db
//     .insert(memberships)
//     .values(newMemberships)
//     .onConflictDoNothing({
//       target: [
//         memberships.userId,
//         memberships.groupId,
//         // memberships['memberships_user_id_group_id'],
//       ],
//     })
//     .returning({
//       userId: memberships.userId,
//       groupId: memberships.groupId,
//       createdBy: memberships.createdBy,
//       createdAt: memberships.createdAt,
//     });

//   return nullIfEmptyArrOrStr(result);
// };

export const insEmployments = async ({
  userIds,
  groupId,
  createdBy,
}: {
  userIds: Array<InsertEmployment['userId']>;
  groupId: InsertEmployment['groupId'];
  createdBy: InsertEmployment['createdBy'];
}) => {
  try {
    const newEmployments: Array<InsertEmployment> = userIds.map((id) => ({
      userId: id,
      groupId,
      createdBy,
    }));

    const result = await db
      .insert(employments)
      .values(newEmployments)
      .onConflictDoNothing({
        target: [employments.userId, employments.groupId],
      })
      .returning();

    return nullIfEmptyArrOrStr(result);
  } catch (error) {
    console.error(error);
  }
};

export const insGroupSession = async (data: InsertGroupSession) => {
  try {
    const timezoneOffset = data.timezoneOffset ?? DEFAULT_TIMEZONE_OFFSET;

    const newGroupSession = { ...data, timezoneOffset };

    const [result] = await db
      .insert(groupSessions)
      .values(newGroupSession)
      .onConflictDoNothing({
        target: [
          groupSessions.groupId,
          groupSessions.name,
          groupSessions.day,
          groupSessions.startAt,
          groupSessions.endAt,
          groupSessions.timezoneOffset,
        ],
      })
      .returning();

    return result;
  } catch (error) {
    console.error(error);
  }
};

export const insMemberCheckins = async ({
  groupId,
  userIds,
  sessionId,
  createdBy,
  confirmed,
  evaluatedBy,
  timezoneOffset = DEFAULT_TIMEZONE_OFFSET,
  createdAt,
}: {
  groupId: InsertMemberCheckin['groupId'];
  userIds: Array<InsertMemberCheckin['userId']>;
  sessionId: InsertMemberCheckin['sessionId'];
  createdBy: InsertMemberCheckin['createdBy'];
  confirmed?: InsertMemberCheckin['confirmed'];
  evaluatedBy?: InsertMemberCheckin['evaluatedBy'];
  timezoneOffset?: InsertGroupSession['timezoneOffset'];
  createdAt?: string; // date iso string | don't use InsertMemberCheckin['createdAt'] since we expect a string
}) => {
  try {
    const createdAtUTCDatetime = createdAt ? new Date(createdAt) : new Date();

    const createdAtLocalDateAdjusted4Tz = getShiftedDateISOStringGivenTz(
      timezoneOffset,
      createdAtUTCDatetime,
    );

    console.log('createdAtLocalDateAdjusted4Tz', createdAtLocalDateAdjusted4Tz);

    const evaluationData = Object.is(confirmed, null)
      ? { confirmed: null, evaluatedBy: null, evaluatedAt: null }
      : typeof confirmed === 'boolean'
        ? {
            confirmed,
            evaluatedBy,
            evaluatedAt: new Date(),
          }
        : {}; // confirmed is undefined

    const newMemberCheckins = userIds.map((userId) => ({
      groupId,
      userId,
      sessionId,
      date: createdAtLocalDateAdjusted4Tz,
      createdAt: createdAtUTCDatetime,
      createdBy,
      ...evaluationData,
    }));

    // TypeError: value.toISOString is not a function | means that drizzle field mismatch to the input (e.g. field date type, with mode:'date' and you're passing a date ISO string instead of a date obj coz a string does not have a method of .toISOString
    // Fix: either pass a js date object to drizzle table field date with mode:'date' or pass a date ISO string to date with mode: 'string'
    const result = await db
      .insert(memberCheckins)
      .values(newMemberCheckins)
      .onConflictDoNothing({
        target: [
          memberCheckins.date,
          memberCheckins.sessionId,
          memberCheckins.userId,
        ],
      })
      .returning();

    return nullIfEmptyArrOrStr(result);
  } catch (error) {
    console.error(error);
  }
};
