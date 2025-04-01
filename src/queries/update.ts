import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { groups, users, type SelectGroup, type SelectUser } from '@/db/schema';

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
