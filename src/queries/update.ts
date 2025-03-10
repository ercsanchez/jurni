import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';

export const updateUserEmailVerified = async (userId: string) => {
  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.id, userId));
};
