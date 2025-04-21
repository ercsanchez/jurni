import fs from 'fs';
import path from 'path';
import { faker } from '@faker-js/faker';

import { DAY_NAMES, DEFAULT_TIMEZONE_OFFSET } from '@/config/constants';
import { genRandomSeedDatetime } from '@/db/scripts/seed-utils';
import {
  RECORD_COUNT,
  SEED_VALUE,
  TEST_GROUPS,
  TEST_GROUP_SESSIONS,
  TEST_USERS_WITH_ACCTS,
  SEED_START_DATE,
  SEED_END_DATE,
} from '@/db/scripts/seed-constants';
import {
  getShiftedDateISOStringGivenTz,
  hashPasswordSync,
  slugify,
} from '@/utils';

export type TableRecord = {
  // [key: string]: string | number | undefined | null | boolean;
  [key: string]: unknown;
};
export type TableData = Array<TableRecord>;

const pathFile = path.join(
  path.dirname(require.main!.filename),
  '..',
  'data',
  'seed.json',
);
const pathDir = path.join(path.dirname(require.main!.filename), '..', 'data');

faker.seed(SEED_VALUE);

async function main() {
  try {
    const data = generateFakeDbTableData();
    const jsonData = JSON.stringify(data);

    if (!fs.existsSync(pathDir)) {
      fs.mkdirSync(pathDir);
    }

    await fs.writeFile(pathFile, jsonData, (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log('data/seed.json generated successfully.');
      }
    });

    // Alternative: use synchronous file write
    // fs.writeFileSync(p, jsonData);
    // console.log('data/seed.json generated successfully.');
  } catch (error) {
    console.error(error);
    console.log('Failed to generate data/seed.json!');
  }
}

main();

function generateFakeDbTableData() {
  const fakeUsers = genUsers();
  const fakeGroups = genGroups();
  const fakeEmployments = genEmployments(fakeUsers, fakeGroups);
  const fakeMemberships = genMemberships(
    fakeUsers,
    fakeGroups,
    fakeEmployments,
  );
  const fakeGroupSessions = genGroupSessions(fakeGroups);

  return {
    users: fakeUsers,
    accounts: genAccounts(fakeUsers),
    userProfiles: genUserProfiles(),
    groups: fakeGroups,
    groupSessions: fakeGroupSessions,
    employments: fakeEmployments,
    memberships: fakeMemberships,
    joinRequests: genJoinRequests(
      fakeUsers,
      fakeGroups,
      fakeEmployments,
      fakeMemberships,
    ),
    memberCheckins: genMemberCheckins(
      fakeMemberships,
      fakeGroupSessions,
      fakeEmployments,
    ),
  };
}

function genMaybeDateString(range?: {
  start?: string | Date;
  end?: string | Date;
}) {
  return faker.helpers.maybe(
    () => genRandomSeedDatetime({ start: range?.start, end: range?.end }),
    {
      probability: 0.6,
    },
  );
}

function genUsers() {
  const genMaybePword = () =>
    faker.helpers.maybe(
      () =>
        faker.internet.password({
          length: 5,
          memorable: true,
        }),
      { probability: 0.6 },
    ) ?? null;

  const result = [];

  for (let i = 0; i < RECORD_COUNT.users; i++) {
    const emailVerified = genMaybeDateString();

    if (i < TEST_USERS_WITH_ACCTS.length) {
      const { name, email, image, unhashedPassword } = TEST_USERS_WITH_ACCTS[i];
      const password = unhashedPassword
        ? hashPasswordSync(unhashedPassword)
        : null;

      const fakeUser = {
        id: (i + 1).toString(),
        name,
        email,
        emailVerified,
        image,
        password,
        unhashedPassword: unhashedPassword ?? null,
      };

      result.push(fakeUser);
    } else {
      const unhashedPassword = genMaybePword();
      const password = unhashedPassword && hashPasswordSync(unhashedPassword);
      const email = faker.internet.email();

      const name = faker.internet.username();
      // .replace('_', '-');

      const fakeUser = {
        id: (i + 1).toString(),
        name,
        email,
        emailVerified,
        password,
        unhashedPassword,
      };

      result.push(fakeUser);
    }
  }

  return result;
}

function genAccounts(fakeUsers: TableData) {
  const result = [];

  for (let i = 0; i < RECORD_COUNT.users; i++) {
    if (i < TEST_USERS_WITH_ACCTS.length) {
      // insert test accounts first
      TEST_USERS_WITH_ACCTS[i]['accounts'].forEach((acct) => {
        result.push({
          ...acct,
          userId: (i + 1).toString(),
          providerAccountId: acct.providerAccountId ?? (i + 1).toString(),
        });
      });
    } else {
      // create fake accounts
      const { id } = fakeUsers[i];

      const credentials = {
        type: 'credentials',
        provider: 'credentials',
        providerAccountId: id,
      };

      const google = {
        type: 'oidc',
        provider: 'google',
        providerAccountId: faker.string.numeric(),
        token_type: 'bearer',
      };

      const accountData = faker.helpers.arrayElement([credentials, google]);

      const fakeAccount = { ...accountData, userId: id };

      result.push(fakeAccount);
    }
  }

  return result;
}

function genUserProfiles() {
  const result = [];

  for (let i = 0; i < RECORD_COUNT.users; i++) {
    if (i < TEST_USERS_WITH_ACCTS.length) {
      // insert test accounts first
      const { userProfile } = TEST_USERS_WITH_ACCTS[i];

      if (userProfile) {
        result.push({ ...userProfile, userId: i + 1 });
        continue;
      }
    }

    const firstName = faker.person.firstName().toLowerCase();
    const middleName = faker.person.middleName().toLowerCase();
    const lastName = faker.person.lastName().toLowerCase();

    const fakeUserProfile = {
      userId: (i + 1).toString(),
      firstName,
      middleName,
      lastName,
    };

    result.push(fakeUserProfile);
  }

  return result;
}

function genGroups() {
  const groupsArr = Object.entries(TEST_GROUPS);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return groupsArr.map(([_k, v], idx) => ({
    id: idx + 1,
    defaultTimezoneOffset: DEFAULT_TIMEZONE_OFFSET,
    slug: slugify(v.name as string),
    ...v,
  }));
}

function genGroupSessions(groups: TableData) {
  const sessionsDataArr = Object.entries(TEST_GROUP_SESSIONS);

  const result: TableData = [];
  let counter = 1;
  sessionsDataArr.forEach(([k, v]) => {
    // matching group record for the session
    const [matchingGroup] = groups.filter(
      (i) => i.name === TEST_GROUPS[k]['name'],
    );
    const {
      id: groupId,
      defaultTimezoneOffset: groupDefaultTimezoneOffset,
      ownedBy: groupOwnerId,
    } = matchingGroup;

    v.forEach((i) => {
      const { days, name, startAt, endAt, timezoneOffset } = i;

      const tzOffset = timezoneOffset
        ? timezoneOffset
        : (groupDefaultTimezoneOffset ?? DEFAULT_TIMEZONE_OFFSET);

      // TODO: const startAt =
      // startAt seed input is the correct time
      // startAt db record is utc time and needs a date obj as input
      // convert startAt seed input to date iso string "1970-01-01T10:30:00.000+08:00"

      days.forEach((day: string) => {
        const groupSession = {
          id: counter,
          groupId,
          name,
          day,
          startAt,
          endAt,
          timezoneOffset: tzOffset,
          // createdBy: users.filter((user) => user.name === 'test')[0].id,
          createdBy: groupOwnerId,
          createdAt: genRandomSeedDatetime({ end: '2025-01-05' }),
          lastEditedAt: faker.helpers.maybe(() => genRandomSeedDatetime(), {
            probability: 0.1,
          }),
          active:
            faker.helpers.maybe(() => true, { probability: 0.8 }) ?? false,
        };

        result.push(groupSession);
        counter++;
      });
    });
  });

  return result;
}

function genEmployments(users: TableData, groups: TableData) {
  const userIds = users.map((i) => i.id);

  const result: TableData = [];
  userIds.forEach((userId) => {
    groups.forEach((group) => {
      //group owner always has an employee record
      if (userId === group.ownedBy) {
        result.push({
          groupId: group.id,
          userId,
          role: 'owner',
          createdBy: group.ownedBy,
          createdAt: genRandomSeedDatetime(),
        });
        return;
      }

      faker.helpers.maybe(
        () => {
          result.push({
            groupId: group.id,
            userId,
            role: 'staff',
            createdBy: group.ownedBy,
            createdAt: genRandomSeedDatetime(),
          });
        },
        {
          probability: 0.25,
        },
      );
    });
  });

  return result;
}

function genMemberships(
  users: TableData,
  groups: TableData,
  employments: TableData,
) {
  const userIds = users.map((i) => i.id);

  const result: TableData = [];
  userIds.forEach((userId) => {
    groups.forEach((group) => {
      const groupEmployeeIds = employments
        .filter((i) => i.groupId === group.id)
        .map((i) => i.userId);

      // no existing group employees
      if (groupEmployeeIds.length === 0) return;

      const memberIdsExceptCurrentUserId = result
        .map((i) => i.userId)
        .filter((i) => i !== userId);

      faker.helpers.maybe(
        () => {
          result.push({
            groupId: group.id,
            userId,
            invitedBy:
              memberIdsExceptCurrentUserId.length > 0
                ? faker.helpers.maybe(
                    () =>
                      faker.helpers.arrayElement(memberIdsExceptCurrentUserId),
                    {
                      probability: 0.3,
                    },
                  )
                : undefined,
            createdBy: faker.helpers.arrayElement(groupEmployeeIds),
            createdAt: genRandomSeedDatetime(),
          });
        },
        {
          probability: 0.6,
        },
      );
    });
  });

  return result;
}

function genJoinRequests(
  users: TableData,
  groups: TableData,
  employments: TableData,
  memberships: TableData,
) {
  const userIds = users.map((i) => i.id);
  const groupIds = groups.map((i) => i.id);

  const result: TableData = [];
  userIds.forEach((userId) => {
    groupIds.forEach((groupId) => {
      const groupMembers = memberships
        .filter((i) => i.groupId === groupId)
        .map((i) => i.userId);

      const userIsAlreadyAMember = groupMembers.includes(userId);

      if (userIsAlreadyAMember) return;

      faker.helpers.maybe(
        () => {
          const groupEmployments = employments
            .filter((i) => i.groupId === groupId)
            .map((i) => i.userId);

          const confirmed =
            groupEmployments.length > 0
              ? faker.helpers.arrayElement([true, false, null])
              : null;

          const evaluatedBy = !Object.is(confirmed, null)
            ? faker.helpers.arrayElement(
                employments
                  .filter((i) => i.groupId === groupId)
                  .map((i) => i.userId),
              )
            : null;

          const evaluatedAt = evaluatedBy ? genMaybeDateString() : null;

          const groupMemberships = memberships
            .filter((i) => i.groupId === groupId)
            .map((i) => i.userId);

          const invitedBy =
            groupMemberships.length > 0
              ? faker.helpers.maybe(
                  () => faker.helpers.arrayElement(groupMemberships),
                  {
                    probability: 0.4,
                  },
                )
              : null;

          result.push({
            groupId,
            userId,
            invitedBy,
            confirmed,
            evaluatedBy,
            evaluatedAt, // must be after createdAt, 0 - max 1 yr
            createdAt: genRandomSeedDatetime(),
          });
        },
        {
          probability: 0.6,
        },
      );
    });
  });

  return result;
}

function genMemberCheckins(
  memberships: TableData,
  groupSessions: TableData,
  employments: TableData,
) {
  // function genMemberCheckins(groupSessions: TableData) {
  const seedStartDate = new Date(SEED_START_DATE);
  const seedEndDate = new Date(SEED_END_DATE);
  const incrementBy1Day = (i: Date) =>
    new Date(i.getTime() + 24 * 60 * 60 * 1000);

  const result: TableData = [];

  for (
    let currDate = seedStartDate;
    currDate < seedEndDate;
    currDate = incrementBy1Day(currDate)
  ) {
    const currDay = DAY_NAMES[currDate.getDay()];

    const applicableGroupSessions = groupSessions.filter((s) => {
      // current day matches the session day && current date is on/after the session creation date
      if (s.day === currDay && currDate >= new Date(s.createdAt as Date))
        return true;

      return false;
    });

    // console.log(currDate, 'applicableGroupSessions', applicableGroupSessions);

    applicableGroupSessions.forEach((s) => {
      const groupMembers = memberships.filter((m) => m.groupId === s.groupId);
      const groupEmployeeIds = employments
        .filter((e) => e.groupId === s.groupId)
        .map((i) => i.userId);

      const sessionTzOffset = s.timezoneOffset as string;

      const currLocalDateISOString = getShiftedDateISOStringGivenTz(
        sessionTzOffset,
        currDate,
      );

      // use getTodayDatetimeStringGivenTimeAndTz
      const sessionStartDatetime = new Date(
        `${currLocalDateISOString}T${s.startAt}${s.timezoneOffset}`,
      );
      const sessionEndDatetime = new Date(
        `${currLocalDateISOString}T${s.endAt}${s.timezoneOffset}`,
      );

      groupMembers.forEach((m) => {
        faker.helpers.maybe(
          () => {
            const createdAt = genRandomSeedDatetime({
              start: sessionStartDatetime,
              end: sessionEndDatetime,
            });
            const date = getShiftedDateISOStringGivenTz(
              sessionTzOffset,
              createdAt,
            );

            const createdByEmployeeId = faker.helpers.maybe(
              () => faker.helpers.arrayElement(groupEmployeeIds),
              { probability: 0.6 },
            );

            const confirmed = createdByEmployeeId
              ? true
              : faker.helpers.arrayElement([false, true, null]);

            const evaluatedBy = Object.is(confirmed, null)
              ? null
              : faker.helpers.arrayElement(groupEmployeeIds);

            const evaluatedAt = Object.is(confirmed, null)
              ? null
              : genRandomSeedDatetime({
                  start: sessionStartDatetime,
                  end: new Date(
                    `${currLocalDateISOString}T${'23:59:59'}${s.timezoneOffset}`,
                  ), // up to last minute and last second of the day
                });

            result.push({
              groupId: m.groupId,
              userId: m.userId,
              sessionId: s.id,
              date,
              createdAt,
              createdBy: createdByEmployeeId ?? m.userId, // if not created by employee, then created by member
              confirmed,
              evaluatedBy,
              evaluatedAt,
            });
          },
          {
            probability: 0.6,
          },
        );
      });
    });
  }

  return result;
}

// faker.helpers.maybe(
//   () => {
//     result.push({});
//   },
//   {
//     probability:
//       faker.helpers.arrayElement([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) / 10,
//   },
// );
