import fs from 'fs';
import path from 'path';

import { dbPool as db } from '@/db';
import {
  accounts,
  employments,
  groups,
  groupSessions,
  joinRequests,
  memberCheckins,
  memberships,
  userProfiles,
  users,
} from '@/db/schema';
import { TableRecord } from './seed-generate';

const p = path.join(
  path.dirname(require.main!.filename),
  '..',
  'data',
  'seed.json',
);

const seedData = JSON.parse(fs.readFileSync(p) as unknown as string);

const {
  users: fakeUsers,
  accounts: newAccounts,
  groups: newGroups,
  userProfiles: newUserProfiles,
  groupSessions: fakeGroupSessions,
  employments: fakeEmployments,
  memberships: fakeMemberships,
  joinRequests: fakeJoinRequests,
  memberCheckins: fakeMemberCheckins,
} = seedData;

// create a function that loops thru the seedDate, and given a set of keys, convert them to date objects or null

const newUsers = fakeUsers.map((user: { [key: string]: string }) => {
  return {
    ...user,
    ...(user.emailVerified
      ? { emailVerified: new Date(user.emailVerified) }
      : {}),
  };
});

const newGroupSessions = fakeGroupSessions.map((i: TableRecord) => {
  return {
    ...i,
    createdAt: new Date(i.createdAt as string),
    lastEditedAt: i.lastEditedAt ? new Date(i.lastEditedAt as string) : null,
  };
});

const newEmployments = fakeEmployments.map((i: TableRecord) => {
  return {
    ...i,
    createdAt: new Date(i.createdAt as string),
  };
});

const newMemberships = fakeMemberships.map((i: TableRecord) => {
  return {
    ...i,
    createdAt: new Date(i.createdAt as string),
  };
});

const newJoinRequests = fakeJoinRequests.map((i: TableRecord) => {
  return {
    ...i,
    createdAt: new Date(i.createdAt as string),
    evaluatedAt: new Date(i.createdAt as string),
  };
});

const newMemberCheckins = fakeMemberCheckins.map((i: TableRecord) => ({
  ...i,
  createdAt: new Date(i.createdAt as string),
  evaluatedAt: i.evaluatedAt ? new Date(i.evaluatedAt as string) : null,
}));

async function main() {
  try {
    await db.transaction(async (tx) => {
      console.log('users---------');
      await tx.insert(users).values(newUsers).onConflictDoNothing();

      console.log('accounts---------');
      await tx.insert(accounts).values(newAccounts).onConflictDoNothing();

      console.log('userProfiles---------');
      await tx
        .insert(userProfiles)
        .values(newUserProfiles)
        .onConflictDoNothing();

      console.log('groups---------');
      await tx.insert(groups).values(newGroups).onConflictDoNothing();

      console.log('groupSessions---------');
      await tx
        .insert(groupSessions)
        .values(newGroupSessions)
        .onConflictDoNothing();

      console.log('employments---------');
      await tx.insert(employments).values(newEmployments).onConflictDoNothing();

      console.log('memberships---------');
      await tx.insert(memberships).values(newMemberships).onConflictDoNothing();

      console.log('joinRequests---------');
      await tx
        .insert(joinRequests)
        .values(newJoinRequests)
        .onConflictDoNothing();

      console.log('memberCheckins---------');
      await tx
        .insert(memberCheckins)
        .values(newMemberCheckins)
        .onConflictDoNothing();
    });

    console.log('Successfully seeded database.');
  } catch (error) {
    console.error(error);
    console.log('Failed to seed database!');
  }
}

main();
