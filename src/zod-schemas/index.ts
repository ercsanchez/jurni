import * as z from 'zod';

import { DAY_NAMES } from '@/config/constants';

export const RegisterSchema = z.object({
  email: z.string().email({ message: 'Email is required / Invalid email' }),
  password: z
    .string()
    .min(6, { message: 'Minimum 6 characters required for Password' }),
  confirmPassword: z
    .string()
    .min(1, { message: 'Password confirmation is required' }),
  name: z.string().min(1, { message: 'Name is required' }),
});

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Email is required / Invalid email' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export const UpdatePasswordSchema = z.object({
  password: z
    .string()
    .min(6, { message: 'Minimum 6 characters required for Password' }),
  confirmPassword: z
    .string()
    .min(1, { message: 'Password confirmation is required' }),
});

export const UpsertUserProfileSchema = z.object({
  firstName: z.string().min(1, { message: 'First Name is required' }),
  // z.optional means can be undefined
  middleName: z.optional(
    // z.string().min(1, { message: 'Do not pass an empty field.' }), // cannot be empty string
    z.string(), // can be empty string
  ),
  lastName: z.string().min(1, { message: 'Last Name is required' }),
});

export const InsertGroupSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
});

export const UpdateGroupSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
});

// this is not correct since "name" and "all" ( ?name=test&all=true) could be present in the query and it won't trigger a failed validation
// export const GroupNameSearchParams = z
//   .object({
//     name: z.optional(
//       z.string().min(1, {
//         message: `url query param ("name") must contain at least 1 char.`,
//       }),
//     ),
//     all: z.literal('true', {
//       errorMap: () => ({
//         message: `URL query param ("all") must be true.`, // unnecessary to specify all=false when not querying all table records from the db
//       }),
//     }),
//   })
//   .strict(); // failed validation when any key, not defined, is present

export const NameSearchParamsSchema = z
  .object({
    name: z.string().min(1, {
      message: `URL query param ("name") must contain at least 1 char.`,
    }),
  })
  .partial() // makes all obj keys optional
  .strict({ message: 'Some invalid URL query params present.' }); // failed validation when any key, not defined, is present

export const AllSearchParamsSchema = z
  .object({
    all: z.literal('true', {
      errorMap: () => ({
        message: `URL query param ("all") must be true.`, // unnecessary to specify all=false when not querying all table records from the db
      }),
    }),
  })
  .partial()
  .strict({ message: 'Some invalid URL query params present.' });

const zArrayStringIds = (tableName: string) =>
  z
    .array(
      z.string().min(1, {
        message: `Invalid ${tableName} Id. Empty string/(s) were passed.`,
      }),
    )
    .nonempty({ message: `You haven't defined any ${tableName}s.` });

export const UserIdsSchema = z.object({
  userIds: zArrayStringIds('User'),
});

export const EvaluateJoinRequestsSchema = z.object({
  userIds: zArrayStringIds('User'),
  confirmed: z.nullable(z.boolean({ message: 'Request must be denied.' })),
});

export const InsertGroupSessionSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
  day: z.enum(DAY_NAMES, { message: 'Invalid day value.' }),
  startAt: z.string().time(),
  endAt: z.string().time(),
  tzOffset: z.optional(
    z.string().min(1, {
      message:
        'Timezone is optional but cannot be an empty string, when defined.',
    }),
  ),
});

// should only edit one session at a time
export const UpdateGroupSessionSchema = z.object({
  id: z.string().min(1, {
    message: `Invalid Group Session Id. Empty string/(s) were passed.`,
  }),
  name: z.string().min(1, { message: 'Name is required.' }).optional(),
  active: z.boolean().optional(),

  // owner can only edit these if no checkins for the session
  // day: z.enum(DAY_NAMES, { message: 'Invalid day value.' }),
  // startAt: z.string().time(),
  // endAt: z.string().time(),
  // tzOffset: z.optional(
  //   z.string().min(1, {
  //     message:
  //       'Timezone is optional but cannot be an empty string, when defined.',
  //   }),
  // ),
});

// use this for query params that have boolean values
// const booleanSearchParamsValues = ['true', 'false'] as const;
// z.enum(booleanSearchParamsValues, {
//   message: `URL query param ("all") must be true or false.`,
// }),
