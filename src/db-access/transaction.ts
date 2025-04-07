import { eq, sql } from 'drizzle-orm';

import { dbPool as db } from '@/db';
import {
  accounts,
  joinRequests,
  memberships,
  users,
  type InsertJoinRequest,
  type InsertMembership,
  type InsertUser,
  type SelectUser,
} from '@/db/schema';
import { nullIfEmptyArrOrStr } from '@/utils';

export const insertUserAndAccountOnCredentialsRegister = async (
  newUser: InsertUser,
) => {
  const result = await db.transaction(async (tx) => {
    const insertedUsers = await tx
      .insert(users)
      .values(newUser)
      .returning({ email: users.email, id: users.id });

    const insertedUser = insertedUsers[0];

    // const insertedAccount = null;

    const insertedAccount = await tx
      .insert(accounts)
      .values({
        userId: insertedUser.id,
        providerAccountId: insertedUser.id,
        type: 'credentials',
        provider: 'credentials',
      })
      .returning({
        userId: accounts.userId,
        providerAccountId: accounts.providerAccountId,
        type: accounts.type,
        provider: accounts.provider,
      });

    if (!insertedUser || !insertedAccount) {
      tx.rollback(); // will always throw an Error obj => "DrizzleError: Rollback"
    }

    return {
      user: insertedUser,
      account: insertedAccount,
    };
  });

  // no need to return null if no result, since we will rollback if unsuccessful, w/c will produce an error
  return result;
};

export const updateUserPasswordAndInsertCredentialsAccount = async (
  userId: SelectUser['id'],
  hashedPword: SelectUser['password'],
) => {
  const result = await db.transaction(async (tx) => {
    const [updatedUser] = await tx
      .update(users)
      .set({ password: hashedPword })
      .where(eq(users.id, userId))
      .returning({ id: users.id, email: users.email });

    // const insertedAccount = null;

    const [insertedAccount] = await tx
      .insert(accounts)
      .values({
        userId: updatedUser.id,
        providerAccountId: updatedUser.id,
        type: 'credentials',
        provider: 'credentials',
      })
      .returning({
        userId: accounts.userId,
        providerAccountId: accounts.providerAccountId,
        type: accounts.type,
        provider: accounts.provider,
      });

    if (!updatedUser || !insertedAccount) {
      tx.rollback(); // will always throw an Error obj => "DrizzleError: Rollback"
    }

    return { ...updatedUser, account: insertedAccount };
  });

  // no need to return null if no result, since we will rollback if unsuccessful, w/c will produce an error
  return result ?? null;
};

export const txDeleteJoinReqsInsertMemberships = async (data: {
  userIds: Array<SelectUser['id']>;
  groupId: InsertJoinRequest['groupId'];
  // confirmed: InsertJoinRequest['confirmed'];
  createdBy: InsertJoinRequest['evaluatedBy'];
  // createdAt: InsertJoinRequest['evaluatedAt'];
}) => {
  const result = await db.transaction(async (tx) => {
    // const updatedJoinReqs = await tx
    //   .update(joinRequests)
    //   .set({ ...rest, confirmed: true })
    //   .where(
    //     sql`${joinRequests.userId} IN ${userIds} AND ${eq(joinRequests.groupId, groupId)}`,
    //   )
    //   .returning();

    const { userIds, groupId, createdBy } = data;

    const deletedJoinReqs = await tx
      .delete(joinRequests)
      .where(
        sql`${joinRequests.userId} IN ${userIds} AND ${eq(joinRequests.groupId, groupId)}`,
      )
      .returning();

    if (!nullIfEmptyArrOrStr(deletedJoinReqs)) tx.rollback();

    const newMemberships = deletedJoinReqs.map((joinReq) => {
      const { userId, groupId, invitedBy } = joinReq;
      return { userId, groupId, invitedBy, createdBy };
    });

    console.log('newMemberships', newMemberships);

    const insertedMemberships = await tx
      .insert(memberships)
      .values(newMemberships as InsertMembership[])
      .onConflictDoNothing({
        target: [memberships.userId, memberships.groupId],
      })
      .returning({
        userId: memberships.userId,
        groupId: memberships.groupId,
        createdBy: memberships.createdBy,
      });

    // if (
    //   !nullIfEmptyArrOrStr(updatedJoinReqs) ||
    //   !nullIfEmptyArrOrStr(insertMemberships)
    // ) {
    //   tx.rollback(); // will always throw an Error obj => "DrizzleError: Rollback"
    // }

    if (!nullIfEmptyArrOrStr(insertedMemberships)) tx.rollback();

    return insertedMemberships;
  });

  // no need to return null if no result, since we will rollback if unsuccessful, w/c will produce an error
  return nullIfEmptyArrOrStr(result);
};
