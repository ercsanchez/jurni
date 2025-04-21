import seedConfig from '@/db/scripts/seed.config';
import { DAY_NAMES, DEFAULT_TIMEZONE_OFFSET } from '@/config/constants';

// ensures data is deterministic | change this if you want the seed data to change
export const SEED_VALUE = 1;

export const SEED_START_DATE = '2025-01-01T00:00:00+08:00';

const SEED_DURATION_IN_DAYS = 15;

// this is in utc
export const SEED_END_DATE = new Date(
  new Date(SEED_START_DATE).getTime() +
    SEED_DURATION_IN_DAYS * 24 * 60 * 60 * 1000,
).toISOString();

export const [sun, mon, tue, wed, thu, fri, sat] = DAY_NAMES;

export const GROUP_TYPES = [
  'jiu jitsu',
  'kickboxing',
  'personal training',
  // 'gymnastics',
];

// export const LIVE_APP_DATE_RANGE = {
//   start: '2025-01-01',
//   end: '2025-01-01',
// };

// // employments and memberships
// export const CHECKINS_DATE_RANGE = {
//   start: '2025-01-01',
//   end: '2025-01-01',
// };

export const [
  jj,
  kb,
  pt,
  // gymnastics
] = GROUP_TYPES;

export const RECORD_COUNT = {
  users: 15,
};

export const TEST_USERS_WITH_ACCTS = [
  {
    name: 'test',
    email: 'test@mail.com',
    unhashedPassword: 'pwordly',
    userProfile: { firstName: 'first', middleName: 'middle', lastName: 'last' },
    accounts: [
      {
        type: 'credentials',
        provider: 'credentials',
        providerAccountId: undefined, // use user id
      },
    ],
  },
  {
    name: seedConfig.USER_NAME,
    email: seedConfig.USER_EMAIL,
    image: seedConfig.USER_IMAGE,
    accounts: [
      {
        type: 'oidc',
        provider: 'google',
        providerAccountId: seedConfig.ACCOUNT_PROVIDER_ID,
        token_type: 'bearer',
      },
    ],
  },
  {
    name: seedConfig.USER_NAME2,
    email: seedConfig.USER_EMAIL2,
    accounts: [
      {
        type: 'credentials',
        provider: 'credentials',
        providerAccountId: undefined, // use user id for credentials
      },
    ],
  },
];

// export const TEST_GROUPS1 = [
//   // { name: 'overlimit jiu jitsu worldwide', type: jj },
//   // { name: 'new ormoc-overlimit jiu jitsu academy', type: jj },
//   // { name: 'overlimit jiu-jitsu tarlac academy', type: jj },
//   // { name: 'iloilo combat types martial arts', type: jj },
//   // { name: 'fraction fitness', type: gym },
//   // { name: 'fraction taekwondo', type: tkd },
//   // { name: 'fraction yoga', type: yoga },
//   // { name: 'fraction gymnastics', type: gymnastics },
//   // { name: 'avengers taekwondo', type: tkd },

//   { name: 'Fraction Jiu Jitsu', type: jj },
//   { name: 'Fraction Kickboxing', type: kb },
//   { name: 'Lorenz PT', type: pt },
// ];

export const TEST_GROUPS: { [key: string]: { [key: string]: unknown } } = {
  // { name: 'overlimit jiu jitsu worldwide', type: jj },
  // { name: 'new ormoc-overlimit jiu jitsu academy', type: jj },
  // { name: 'overlimit jiu-jitsu tarlac academy', type: jj },
  // { name: 'iloilo combat types martial arts', type: jj },
  // { name: 'fraction fitness', type: gym },
  // { name: 'fraction taekwondo', type: tkd },
  // { name: 'fraction yoga', type: yoga },
  // { name: 'fraction gymnastics', type: gymnastics },
  // { name: 'avengers taekwondo', type: tkd },

  fractionJj: { name: 'Fraction JJ', type: jj, ownedBy: '2' },
  fractionKb: { name: 'Fraction Kickboxing', type: kb, ownedBy: '2' },
  lorenzPt: { name: 'Lorenz PT', type: pt, ownedBy: '3' },
  // fractionGymnastics: {
  //   name: 'Fraction Gymnastics',
  //   type: gymnastics,
  //   ownedBy: 2,
  // },
};

export const TEST_GROUP_SESSIONS = {
  // fractionGymnastics: [
  //   {
  //     name: 'Gymnastics Sat',
  //     days: [sat, sun],

  //     startAt: '09:00:00',
  //     endAt: '10:30:00',
  //     timezoneOffset: DEFAULT_TIMEZONE_OFFSET,
  //   },
  // ],
  fractionJj: [
    {
      name: 'Adults Morning',
      days: [mon, tue, thu],
      startAt: '09:30:00',
      endAt: '11:00:00',
      timezoneOffset: DEFAULT_TIMEZONE_OFFSET,
    },
  ],

  // Singapore Timezone (UTC +8) | Set correct timezones for the rest
  // startAt: '1970-01-01T09:00:00.000+08:00',
  // endAt: '1970-01-01T10:30:00.000+08:00',

  // better to not separate fraction jj adults and teens into 2 groups since alot of their groupSessions have the same startAt values
  // 'fraction jiu jitsu': [
  //   {
  //     name: 'Adults Morning',
  //     days: [mon, tue, thu],
  //     startAt: '1970-01-01T09:30:00+08:00',
  //     endAt: '1970-01-01T11:00:00+08:00',
  //   },
  //   // using Minors instead of Kids and Teens for simplicity (Minors is applicable to both)
  //   {
  //     name: 'Adults & Minors Lvl 3 Weekday Afternoon',
  //     days: [mon, wed],
  //     startAt: '1970-01-01T17:30:00+08:00',
  //     endAt: '1970-01-01T18:30:00+08:00',
  //   },
  //   {
  //     name: 'Adults & Minors Lvl 3 Weekday Afternoon - No Gi',
  //     days: [fri],
  //     startAt: '1970-01-01T17:30:00+08:00',
  //     endAt: '1970-01-01T18:30:00+08:00',
  //   },
  //   {
  //     name: 'Adults Evening',
  //     days: [mon, tue, wed],
  //     startAt: '1970-01-01T19:30:00+08:00',
  //     endAt: '1970-01-01T21:30:00+08:00',
  //   },
  //   // group owner's choide whether to separate gi and no gi into different groupSessions
  //   {
  //     name: 'Adults Evening - No Gi',
  //     days: [thu],
  //     startAt: '1970-01-01T19:30:00+08:00',
  //     endAt: '1970-01-01T21:30:00+08:00',
  //   },
  //   {
  //     name: 'Adults & Minors Lvl 3 Evening',
  //     days: [fri],
  //     startAt: '1970-01-01T19:30:00+08:00',
  //     endAt: '1970-01-01T21:30:00+08:00',
  //   },
  //   {
  //     name: 'Adults Sat',
  //     days: [sat],
  //     startAt: '1970-01-01T14:30:00+08:00',
  //     endAt: '1970-01-01T16:30:00+08:00',
  //   },
  //   {
  //     name: 'Adults & Minors Level 1 & 2 Sun',
  //     days: [sun],
  //     startAt: '1970-01-01T16:30:00+08:00',
  //     endAt: '1970-01-01T18:00:00+08:00',
  //   },
  //   // either more general or more granular groupSessions but best to only have one unique group + groupSession time period  to avoid confusion for members and employees, when checking in
  //   {
  //     name: 'Minors Lvl 1 Fri',
  //     days: [fri],
  //     startAt: '1970-01-01T16:30:00+08:00',
  //     endAt: '1970-01-01T17:30:00+08:00',
  //   },
  //   {
  //     name: 'Minors Lvl 1 Sat',
  //     days: [sat],
  //     startAt: '1970-01-01T13:00:00+08:00',
  //     endAt: '1970-01-01T14:30:00+08:00',
  //   },
  //   {
  //     name: 'Minors Lvl 3 Weekday',
  //     days: [mon, wed],
  //     startAt: '1970-01-01T17:30:00+08:00',
  //     endAt: '1970-01-01T18:30:00+08:00',
  //   },
  //   {
  //     name: 'Minors Lvl 2 & 3 Weekday - No Gi',
  //     days: [fri],
  //     startAt: '1970-01-01T17:30:00+08:00',
  //     endAt: '1970-01-01T18:30:00+08:00',
  //   },
  //   {
  //     name: 'Minors Lvl 2 & 3 Sat',
  //     days: [sat],
  //     startAt: '1970-01-01T14:30:00+08:00',
  //     endAt: '1970-01-01T16:30:00+08:00',
  //   },
  //   // even though teens lvl 2 & 3 groupSessions end at different times
  //   // (16:00 & 16:30, respectively), we don't monitor checkouts so it wont
  //   // matter in the end

  //   // {
  //   //   name: 'Minors Lvl 3 Sat',
  //   //   days: [sat],
  //   //   startAt: '1970-01-01T14:30:00+08:00',
  //   //   endAt: '1970-01-01T16:30:00+08:00',
  //   // },
  // ],
};
