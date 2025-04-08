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
  try {
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
  } catch (error) {
    console.error(error);
  }
};

export const updateUserPasswordAndInsertCredentialsAccount = async (
  userId: SelectUser['id'],
  hashedPword: SelectUser['password'],
) => {
  try {
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
  } catch (error) {
    console.error(error);
  }
};

// INSERT MEMBERSHIPS FOR APPROVED JOIN REQUESTS (DELETED)
export const txDelJoinReqsThenInsMemberships = async (data: {
  userIds: Array<SelectUser['id']>;
  groupId: InsertJoinRequest['groupId'];
  // confirmed: InsertJoinRequest['confirmed'];
  createdBy: InsertJoinRequest['evaluatedBy'];
  // createdAt: InsertJoinRequest['evaluatedAt'];
}) => {
  try {
    const result = await db.transaction(async (tx) => {
      // const updatedJoinReqs = await tx
      //   .update(joinRequests)
      //   .set({ ...rest, confirmed: true })
      //   .where(
      //     sql`${joinRequests.userId} IN ${userIds} AND ${eq(joinRequests.groupId, groupId)}`,
      //   )
      //   .returning();

      const { userIds, groupId, createdBy } = data;

      const deletedJoinRequests = await tx
        .delete(joinRequests)
        .where(
          sql`${joinRequests.userId} IN ${userIds} AND ${eq(joinRequests.groupId, groupId)}`,
        )
        .returning();

      if (!nullIfEmptyArrOrStr(deletedJoinRequests)) tx.rollback();

      const newMemberships = deletedJoinRequests.map((joinReq) => {
        const { userId, groupId, invitedBy } = joinReq;
        return { userId, groupId, invitedBy, createdBy };
      });

      // console.log('newMemberships', newMemberships);

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

      return { deletedJoinRequests, insertedMemberships };
    });

    // no need to return null if no result, since we will rollback if unsuccessful, w/c will produce an error
    return result;
  } catch (error) {
    console.error(error);
  }
};

//
export const txInsMembershipsAndDelJoinReqsIfExists = async (data: {
  userIds: Array<InsertMembership['userId']>;
  groupId: InsertMembership['groupId'];
  createdBy: InsertMembership['createdBy'];
  invitedBy?: InsertMembership['invitedBy'];
}) => {
  try {
    const result = await db.transaction(async (tx) => {
      const { userIds, groupId, ...rest } = data;

      const newMemberships = userIds.map((id) => {
        return { userId: id, groupId, ...rest };
      });

      const insertedMemberships = await tx
        .insert(memberships)
        .values(newMemberships)
        .onConflictDoNothing({
          target: [memberships.userId, memberships.groupId],
        })
        .returning();

      if (!nullIfEmptyArrOrStr(insertedMemberships)) tx.rollback();

      // deletedJoinRequests may be empty [] since userId may not have an existing Join Request
      // inserting a membership should always trigger deletion of its join request (if exists)
      const deletedJoinRequests = await tx
        .delete(joinRequests)
        .where(
          sql`${joinRequests.userId} IN ${userIds} AND ${eq(joinRequests.groupId, groupId)}`,
        )
        .returning();

      // transaction also fails if any of the queries above fail (even w/o explicityly running tx.rollback(), if a null result is returned from a query)

      return { insertedMemberships, deletedJoinRequests };
    });

    // no need to return null if no result, since we will rollback if unsuccessful, w/c will produce an error
    return result;
  } catch (error) {
    console.error(error);
  }
};
