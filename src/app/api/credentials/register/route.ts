import { NextRequest } from 'next/server';
import { DrizzleError } from 'drizzle-orm';

import { selectUserByEmail } from '@/queries/select';
import { insertUserAndAccountOnCredentialsRegister } from '@/queries/transaction';
import {
  hashPassword,
  httpRes,
  serverResponseError,
  zodValidate,
} from '@/utils';
import { RegisterSchema } from '@/zod-schemas';

export const POST = async function POST(req: NextRequest) {
  console.log('running registerUser');

  try {
    const data = await req.json();
    // console.log('data', data);

    const validation = zodValidate(RegisterSchema, data);
    // console.log('validation', JSON.stringify(validation));

    if (!validation?.success) {
      // console.log('validation failed');
      return httpRes.badRequest({ message: validation?.message });
    }

    // const { email, password, confirmPassword, name } = validation.data;
    const { email, password, confirmPassword } = validation.data;

    if (password !== confirmPassword) {
      return httpRes.badRequest({
        message: "Password and Confirm Password doesn't match.",
      });
    }

    const existingUser = await selectUserByEmail(email);
    // console.log('existingUser', existingUser);

    if (existingUser)
      return httpRes.conflict({
        message:
          'Account already exists. Please sign in with the same account you used originally',
      });

    const hashedPassword = await hashPassword(password);

    // by default next-auth doesn't expect user to have an account when signing in via credentials

    // DB TRANSACTION
    // ensures user and account are always created together on registration via credentials
    const result = await insertUserAndAccountOnCredentialsRegister({
      password: hashedPassword,
      // email,
      // name,
      ...validation.data,
    });

    console.log('insertedUser and insertedAcct', result);

    // no need since already throwing error in transaction
    // if (!insertedUserAndAcct)
    //   throw new Error('Account not created. Please try again.');

    console.log('result', result);

    return httpRes.created({
      message: 'Account was successfully created.',
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof DrizzleError && error.message.includes('Rollback')) {
      console.error(error);
      return httpRes.internalServerErr({
        message: 'Account was not created. Please try again.',
      });
    }

    return serverResponseError(error);
  }
};

// ------------------------------------------------------------------
// // SEPARATE QUERIES
// const insertedUser = await insertUser({
//   password: hashedPassword,
//   email,
//   name,
// });

// console.log('insertedUser', insertedUser);
// if (!insertedUser) {
//   return httpRes.internalServerErr({
//     message: 'Failed to create account.',
//   });
// }

// // create account record | this should be a transaction with user creation
// const insertedAccount = await insertAccount({
//   userId: insertedUser.id,
//   providerAccountId: insertedUser.id,
//   type: 'credentials',
//   provider: 'credentials',
// });

// const result = { user: insertedUser, account: [insertedAccount] };
// ------------------------------------------------------------------
