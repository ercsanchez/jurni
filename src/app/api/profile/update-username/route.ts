import { NextRequest } from 'next/server';

import { selectUserById } from '@/db-access/select';
import { upUser } from '@/db-access/update';
import { currentAuthUser } from '@/lib/nextauth';
import { httpRes, serverResponseError, zodValidate } from '@/utils';
import { UpdateUserNameSchema } from '@/zod-schemas';

export const PATCH = async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await currentAuthUser();

    if (!sessionUser)
      return httpRes.unauthenticated({ message: 'User is not authenticated.' });

    const existingUser = await selectUserById(sessionUser!.id!);

    if (!existingUser)
      return httpRes.notFound({
        message: 'User does not exist.',
      });

    const data = await req.json();

    const validation = zodValidate(UpdateUserNameSchema, data);

    const result = await upUser({
      userId: sessionUser.id!,
      name: validation.data.name,
    });

    if (!validation?.success)
      return httpRes.badRequest({ message: validation?.message });
    return httpRes.ok({
      message: 'Username was successfully updated.',
      data: result,
    });
  } catch (error: unknown) {
    return serverResponseError(error);
  }
};
