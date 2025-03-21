import { db } from '@/db';
import {
  accounts,
  users,
  type InsertAccount,
  type InsertUser,
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
