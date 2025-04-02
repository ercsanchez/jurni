import { currentAuthUser } from '@/lib/nextauth';
import {
  queryFindGroupByIdWithOwner,
  selectUserById,
} from '@/db-access/select';
import { updateGroup } from '@/db-access/update';
import { httpRes, zodValidate, serverResponseError } from '@/utils';
import { UpdateGroupSchema } from '@/zod-schemas';

export const PATCH = async function PATCH(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  console.log('running PATCH api/groups');

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

    const validation = zodValidate(UpdateGroupSchema, data);

    if (!validation?.success) {
      console.error(new Error(`ZodError: ${validation.message}`));
      return httpRes.badRequest({ message: validation?.message });
    }

    const { groupId } = await params;

    const existingGroup = await queryFindGroupByIdWithOwner({
      id: groupId,
      withOwner: true,
    });

    console.log('existingGroup----------------', existingGroup);

    if (!existingGroup)
      return httpRes.notFound({ message: 'Group does not exist.' });

    const result = await updateGroup({
      id: groupId,
      ownerId: sessionUser.id!,
      ...validation.data,
    });

    if (!result)
      return httpRes.badRequest({
        message: 'Group failed to update.',
      });

    return httpRes.ok({
      message: 'Group was successfully updated.',
      data: result,
    });
  } catch (error: unknown) {
    return serverResponseError(error);
  }
};
