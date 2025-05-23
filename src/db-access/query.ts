import { eq } from 'drizzle-orm';

import { db } from '@/db';
import {
  accounts,
  employments,
  groups,
  groupSessions,
  joinRequests,
  memberships,
  users,
  userProfiles,
  type SelectAccount,
  type SelectEmployment,
  type SelectGroup,
  type SelectGroupSession,
  type SelectJoinRequest,
  type SelectMembership,
  type SelectUser,
  type SelectUserProfile,
} from '@/db/schema';
import { nullIfEmptyArrOrStr } from '@/utils';

interface WithOwner {
  with: {
    owner?: true;
  };
}

export const qryFindUserByEmailWithAccts = async (
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

// use query parameter to pass provider
export const qryFindUserByEmailWithAcctWhereProvider = async (
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

export const qryFindUserByIdWithOwnedGroups = async (id: SelectUser['id']) => {
  const result = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      ownedGroups: true,
    },
  });

  // findFirst returns undefined if no match
  return result;
};

export const qryFindGroupsByownedByWithOwner = async (
  ownedBy: SelectGroup['ownedBy'],
) => {
  const result = await db.query.groups.findMany({
    where: eq(groups.ownedBy, ownedBy),
    with: {
      owner: true,
    },
  });

  // findMany returns array w/c is empty if none found
  // return result.length > 0 ? result : null;
  return nullIfEmptyArrOrStr(result);
};

export const qryFindUserByIdWithProfile = async (id: SelectUser['id']) => {
  const result = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      profile: true,
    },
  });

  // findFirst returns undefined if no match
  return result;
};

export const qryFindProfileByUserIdWithUser = async (
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

export const qryFindGroupBySlugWithOwner = async ({
  slug,
  withOwner = true,
}: {
  slug: SelectGroup['slug'];
  withOwner?: boolean;
}) => {
  const conditionalQueryProps: WithOwner | object = withOwner
    ? { with: { owner: true } }
    : {};
  // - OR -
  // const conditionalQueryProps: undefined | { with: { owner?: true } } =
  //   withOwner ? { with: { owner: true } } : undefined;

  const result = await db.query.groups.findFirst({
    where: eq(groups.slug, slug),
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

export const qryFindGroupsByownedBy = async (
  ownedBy: SelectGroup['ownedBy'],
) => {
  const result = await db.query.groups.findMany({
    where: eq(groups.ownedBy, ownedBy),
  });

  // findMany returns array w/c is empty if none found
  // return result.length > 0 ? result : null;
  return nullIfEmptyArrOrStr(result);
};

export const qryFindGroupByIdWithMemberships = async (
  groupId: SelectGroup['id'],
) => {
  const result = await db.query.groups.findFirst({
    where: eq(groups.id, groupId),
    with: { memberships: { with: { user: true } } },
  });

  return result ?? null;
};

export const qryGroupBySlug = async ({
  // groupId,
  groupSlug,
  whereEmployeeUserId,
  whereMemberUserId,
  whereJoinReqUserId,
  whereGroupSessionId,
  withEmployees = false,
  withMembers = false,
  withJoinReqs = false,
  withGroupSessions = false,
}: {
  // groupId: SelectGroup['id'];
  groupSlug: SelectGroup['slug'];
  whereEmployeeUserId?: SelectEmployment['userId'];
  whereMemberUserId?: SelectMembership['userId'];
  whereJoinReqUserId?: SelectJoinRequest['userId'];
  whereGroupSessionId?: SelectGroupSession['id'];
  withEmployees?: boolean;
  withMembers?: boolean;
  withJoinReqs?: boolean;
  withGroupSessions?: boolean;
}) => {
  try {
    // const withMemberships: { memberships: { with: { user: true } } } | object =
    //   withMembers ? { memberships: { with: { user: true } } } : {};

    // const withJoinRequests: { joinRequests: { with: { user: true } } } | object =
    //   withJoinReqs ? { joinRequests: { with: { user: true } } } : {};

    const result = await db.query.groups.findFirst({
      where: eq(groups.slug, groupSlug),
      with: {
        employments: whereEmployeeUserId
          ? // get employee record of current auth user
            { where: eq(employments.userId, whereEmployeeUserId!) }
          : withEmployees
            ? { with: { user: true } } // get all employees
            : {},

        memberships: whereMemberUserId
          ? { where: eq(memberships.userId, whereMemberUserId!) }
          : withMembers
            ? { with: { user: true } }
            : {},

        joinRequests: whereJoinReqUserId
          ? { where: eq(joinRequests.userId, whereJoinReqUserId!) }
          : withJoinReqs
            ? { with: { user: true } }
            : {},

        groupSessions: whereGroupSessionId
          ? { where: eq(groupSessions.id, whereGroupSessionId!) }
          : withGroupSessions
            ? true
            : {},

        // ...(withJoinReqs && { joinRequests: { with: { user: true } } }),

        // ...(withMembers && {
        //   memberships: { with: { user: true, joinRequest: true } },
        // }),

        // ...withMemberships,
      },
    });

    return result ?? null;
  } catch (error) {
    console.error(error);
  }
};

// redundant | use qryGroupBySlug
// export const qryFindGroupByIdWithEmployments = async (
//   groupId: SelectGroup['id'],
// ) => {
//   const result = await db.query.groups.findFirst({
//     where: eq(groups.id, groupId),
//     with: { employments: { with: { user: true } } },
//   });

//   return result ?? null;
// };

// export const qryGroupBySlugWithJoinReqByUserId = async ({
//   groupId,
//   userId,
//   unevaluated,
// }: {
//   groupId: SelectJoinRequest['groupId'];
//   userId: SelectJoinRequest['userId'];
//   unevaluated?: true;
// }) => {
//   const whereJoinReqs = unevaluated
//     ? {
//         joinRequests: {
//           where: and(
//             eq(joinRequests.userId, userId),
//             isNull(joinRequests.confirmed),
//             //  join req has not yet been evaluated (confirmed is null)
//           ),
//         },
//       }
//     : // include any type of user's join req for the group
//       { joinRequests: { where: and(eq(joinRequests.userId, userId)) } };

//   const result = await db.query.groups.findFirst({
//     where: eq(groups.id, groupId),
//     with: {
//       ...whereJoinReqs,
//     },
//   });

//   return result ?? null;
// };
