import { NextRequest } from 'next/server';

import { currentAuthUser } from '@/lib/nextauth';
import { insertOrUpdateUserProfile } from '@/db-access/insert';
import {
  queryFindUserByIdWithProfile,
  // queryFindProfileByUserIdWithUser
} from '@/db-access/query';
import { selectUserById } from '@/db-access/select';
import { httpRes, zodValidate, serverResponseError } from '@/utils';
import { UpsertUserProfileSchema } from '@/zod-schemas';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest | Request) {
  console.log('running GET api/profile');
  try {
    const sessionUser = await currentAuthUser();
    console.log('sessionUser', sessionUser);
    if (!sessionUser)
      return httpRes.unauthenticated({ message: 'User is not authenticated.' });

    const existingUser = await selectUserById(sessionUser!.id!);

    if (!existingUser)
      return httpRes.notFound({
        message: 'Account does not exist.',
      });

    const result = await queryFindUserByIdWithProfile(sessionUser.id!);

    if (!result?.profile)
      return httpRes.notFound({ message: 'Account Profile does not exist.' });

    return httpRes.ok({ message: 'Account Profile found.', data: result });
  } catch (error: unknown) {
    // if (error instanceof DrizzleError && error.message.includes('Rollback')) {
    //   console.error(error);
    //   return httpRes.internalServerErr({
    //     message: 'Account Profile failed to update.',
    //   });
    // }

    return serverResponseError(error);
  }
}

// upsert is PUT | PUT can be used to create if not exists or update entire resource | PATCH is for just updating
export const PUT = async function PUT(req: NextRequest | Request) {
  console.log('running PUT api/profile');

  try {
    const sessionUser = await currentAuthUser();

    if (!sessionUser)
      return httpRes.unauthenticated({ message: 'User is not authenticated.' });

    const existingUser = await selectUserById(sessionUser!.id!);

    if (!existingUser)
      return httpRes.notFound({
        message: 'Account does not exist.',
      });

    const data = await req.json();

    const validation = zodValidate(UpsertUserProfileSchema, data);

    if (!validation?.success)
      return httpRes.badRequest({ message: validation?.message });

    // TODO: optional db table fields (e.g. middleName) will be written with null if no value, should I check if null/undefined and write empty string to db?
    // const { firstName, middleName, lastName } = validation.data;

    const result = await insertOrUpdateUserProfile({
      ...validation.data,
      userId: sessionUser.id!,
    });

    if (!result)
      return httpRes.badRequest({
        message: 'Account Profile failed to update.',
      });

    // console.log('error: userWithProfile');
    // const userWithProfile = await queryFindUserByIdWithProfile(
    //   sessionUser.id!,
    // );
    // console.log('userWithProfile', userWithProfile);

    // console.log('error: userProfileWithUser');
    // const userProfileWithUser = await queryFindProfileByUserIdWithUser(
    //   sessionUser.id!,
    // );
    // console.log('userProfileWithUser', userProfileWithUser);

    // console.log('upsertedUserProfile====>', upsertedUserProfile);

    return httpRes.ok({
      message: 'Account Profile updated.',
      // data: { userProfile: result, userWithProfile, userProfileWithUser },
      // data: { userProfile: result },
      data: result,
    });

    // return httpRes.ok({
    //   message: 'Account Profile was successfully updated.',
    //   data: result,
    // });
  } catch (error: unknown) {
    // if (error instanceof DrizzleError && error.message.includes('Rollback')) {
    //   console.error(error);
    //   return httpRes.internalServerErr({
    //     message: 'Account Profile failed to update.',
    //   });
    // }

    return serverResponseError(error);
  }
};
