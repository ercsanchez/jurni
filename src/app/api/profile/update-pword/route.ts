// import { NextRequest, NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { DrizzleError } from 'drizzle-orm';

import { currentAuthUser } from '@/lib/nextauth';
import { updateUserPassword } from '@/db-access/update';
// import handler from '@/middleware/handler';
// import authCheck from '@/middleware/authCheck';
import { queryFindUserByEmailWithAcctWhereProvider } from '@/db-access/query';
import { updateUserPasswordAndInsertCredentialsAccount } from '@/db-access/transaction';
import {
  httpRes,
  zodValidate,
  hashPassword,
  serverResponseError,
} from '@/utils';
import { UpdatePasswordSchema } from '@/zod-schemas';

// authCheck only checks if user is authenticated
// export const PATCH = handler(authCheck, updatePword);

// USE THIS IN USER'S SETTINGS PAGE TO ADD A PASSWORD AND CREATE A CREDENTIALS ACCOUNT THAT WILL ALLOW USER TO SIGN IN VIA CREDENTIALS (EMAIL + PASSWORD)

// add this if below is uncommented: eslint-disable-next-line @typescript-eslint/no-unused-vars
// async function updatePword(req: NextRequest | Request, res: NextResponse) {

export const PATCH = async function PATCH(
  req: NextRequest | Request,
  // res: NextResponse,
) {
  console.log('running updatePword');

  try {
    // check if user is authorized (requesting user is authenticated and exists in the database)
    const sessionUser = await currentAuthUser();
    // const existingUser = await selectUserById(sessionUser?.id!);

    console.log('session user check', Boolean(sessionUser));
    if (!sessionUser)
      return httpRes.unauthenticated({ message: 'User is not authenticated.' });

    const existingUserWithCredentialsAcct =
      await queryFindUserByEmailWithAcctWhereProvider(
        sessionUser!.email!,
        'credentials',
      );

    if (!existingUserWithCredentialsAcct)
      return httpRes.forbidden({
        message: 'User does not exist. Request is not allowed.',
      });

    const data = await req.json();

    const validation = zodValidate(UpdatePasswordSchema, data);

    if (!validation?.success)
      return httpRes.badRequest({ message: validation?.message });

    const { password, confirmPassword } = validation.data;

    if (password !== confirmPassword)
      return httpRes.badRequest({
        message: "Password and Confirm Password doesn't match.",
      });

    const hashedPassword = await hashPassword(password);

    const [account] = existingUserWithCredentialsAcct.accounts;

    let result;

    if (account) {
      // account already exists, so no need to create account

      // we will update the password, regardless if forwarded pword is diff to the user's pword in the db
      result = await updateUserPassword(
        existingUserWithCredentialsAcct.id,
        hashedPassword,
      );
    } else {
      // account doesn't exist
      result = await updateUserPasswordAndInsertCredentialsAccount(
        existingUserWithCredentialsAcct.id,
        hashedPassword,
      );
    }

    // console.log('updated User and/or inserted Acct', result);

    // no need since already throwing error in transaction
    // if (!insertedUserAndAcct)
    //   throw new Error('Transaction failed. Please try again.');

    return httpRes.ok({
      message: 'Account was successfully updated.',
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof DrizzleError && error.message.includes('Rollback')) {
      console.error(error);
      return httpRes.internalServerErr({
        message: 'Account was not successfully updated.',
      });
    }

    return serverResponseError(error);
  }
};
