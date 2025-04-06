import { db } from '@/db';
import {
  accounts,
  employments,
  groups,
  memberships,
  users,
  userProfiles,
  type InsertAccount,
  type InsertEmployment,
  type InsertGroup,
  type InsertMembership,
  type InsertUser,
  type InsertUserProfile,
} from '@/db/schema';
import { nullIfEmptyArrOrStr } from '@/utils';

export const insertUser = async (newUser: InsertUser) => {
  const [result] = await db
    .insert(users)
    .values(newUser)
    .returning({ email: users.email, id: users.id });

  return result ?? null;
};

export const insertAccount = async (newAccount: InsertAccount) => {
  const [result] = await db.insert(accounts).values(newAccount).returning({
    userId: accounts.userId,
    providerAccountId: accounts.providerAccountId,
    type: accounts.type,
    provider: accounts.provider,
  });

  return result ?? null;
};

export const insertOrUpdateUserProfile = async (
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

export const insertGroup = async (newGroup: InsertGroup) => {
  const [result] = await db.insert(groups).values(newGroup).returning({
    name: groups.name,
  });

  console.log('insertGroup', result);

  return result ?? null;
};

export const insertMemberships = async ({
  userIds,
  groupId,
  confirmedBy,
}: {
  userIds: Array<InsertMembership['userId']>;
  groupId: InsertMembership['groupId'];
  confirmedBy: InsertMembership['confirmedBy'];
}) => {
  const newMemberships: Array<InsertMembership> = userIds.map((userId) => ({
    userId,
    groupId,
    confirmedBy,
  }));

  const result = await db
    .insert(memberships)
    .values(newMemberships)
    .onConflictDoNothing({
      target: [
        memberships.userId,
        memberships.groupId,
        // memberships['memberships_user_id_group_id'],
      ],
    })
    .returning({
      userId: memberships.userId,
      groupId: memberships.groupId,
      confirmedBy: memberships.confirmedBy,
      createdAt: memberships.createdAt,
    });

  return nullIfEmptyArrOrStr(result);
};

export const insertEmployments = async ({
  userIds,
  groupId,
  addedBy,
}: {
  userIds: Array<InsertEmployment['userId']>;
  groupId: InsertEmployment['groupId'];
  addedBy: InsertEmployment['addedBy'];
}) => {
  const newEmployments: Array<InsertEmployment> = userIds.map((userId) => ({
    userId,
    groupId,
    addedBy,
  }));

  const result = await db
    .insert(employments)
    .values(newEmployments)
    .onConflictDoNothing({
      target: [employments.userId, employments.groupId],
    })
    .returning({
      userId: employments.userId,
      groupId: employments.groupId,
      addedBy: employments.addedBy,
      createdAt: employments.createdAt,
    });

  return nullIfEmptyArrOrStr(result);
};
