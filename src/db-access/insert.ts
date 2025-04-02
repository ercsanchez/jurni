import { db } from '@/db';
import {
  accounts,
  groups,
  users,
  userProfiles,
  type InsertAccount,
  type InsertGroup,
  type InsertUser,
  type InsertUserProfile,
} from '@/db/schema';

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
