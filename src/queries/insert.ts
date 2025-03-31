import { db } from '@/db';
import {
  accounts,
  users,
  userProfiles,
  type InsertAccount,
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
