import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { users, type SelectUser } from '@/db/schema';

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
