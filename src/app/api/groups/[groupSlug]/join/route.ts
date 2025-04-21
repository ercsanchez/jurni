import { currentAuthUser } from '@/lib/nextauth';
import { delJoinReq } from '@/db-access/delete';
import { insertJoinRequest } from '@/db-access/insert';
import { qryGroupBySlug } from '@/db-access/query';
import {
  selGroupBySlug,
  selJoinRequest,
  selectUserById,
} from '@/db-access/select';
import { httpRes, serverResponseError } from '@/utils';

// authenticated user requests to join group
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ groupSlug: string }> },
) {
  try {
    const sessionUser = await currentAuthUser();
    if (!sessionUser)
      return httpRes.unauthenticated({ message: 'User is not authenticated.' });

    const existingUser = await selectUserById(sessionUser!.id!);

    if (!existingUser)
      return httpRes.notFound({
        message: 'User does not exist.',
      });

    const { groupSlug } = await params;

    // const existingGroup = await selGroupBySlug(groupSlug);

    const existingGroup = await qryGroupBySlug({
      groupSlug,
      whereMemberUserId: sessionUser.id,
    });

    if (!existingGroup)
      return httpRes.notFound({ message: 'Group does not exist.' });

    const { id: groupId } = existingGroup;

    const [existingMembership] = existingGroup.memberships;

    // already a member so cannot make a join request
    if (existingMembership) {
      return httpRes.forbidden({
        message:
          'Current User is already a member so cannot request to join group.',
      });
    }

    const result = await insertJoinRequest({
      userId: sessionUser.id!,
      groupId,
    });

    if (!result)
      // join request already exists if it wasn't created
      return httpRes.badRequest({
        message: `Join Request already exists.`,
      });

    return httpRes.ok({
      message: `Join Request was successfully created.`,
      data: result,
    });
  } catch (error: unknown) {
    return serverResponseError(error);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ groupSlug: string }> },
) {
  try {
    const sessionUser = await currentAuthUser();
    if (!sessionUser)
      return httpRes.unauthenticated({ message: 'User is not authenticated.' });

    const existingUser = await selectUserById(sessionUser!.id!);

    if (!existingUser)
      return httpRes.notFound({
        message: 'User does not exist.',
      });

    const { groupSlug } = await params;

    // NO NEED TO CHECK IF USER HAS A JOIN REQ
    // query group with current auth user's unconfirmed join request
    // do not delete if it was already evaluated (joinRequests.confirmed is not null)
    // const existingGroup = await qryGroupBySlugWithJoinReqByUserId({
    //   userId: sessionUser.id!,
    //   groupId,
    //   unevaluated: true,
    // });

    // if (!nullIfEmptyArrOrStr(existingGroup.joinRequests))
    //   return httpRes.badRequest({
    //     message:
    //       "Join Request doesn't exist. / Cannot delete a previously evaluated Join Request.",
    //   });

    // const result = await delUnevaluatedJoinReq({
    //   userId: sessionUser.id!,
    //   groupId,
    // });

    const existingGroup = await selGroupBySlug(groupSlug);

    if (!existingGroup)
      return httpRes.notFound({ message: 'Group does not exist.' });

    const { id: groupId } = existingGroup;

    const result = await delJoinReq({
      userId: sessionUser.id!,
      groupId,
    });

    if (!result)
      return httpRes.badRequest({
        message: `Join Request to delete does not exist.`,
      });

    return httpRes.ok({
      message: `Join Request was successfully deleted.`,
      data: result,
    });
  } catch (error: unknown) {
    return serverResponseError(error);
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ groupSlug: string }> },
) {
  try {
    const sessionUser = await currentAuthUser();
    if (!sessionUser)
      return httpRes.unauthenticated({ message: 'User is not authenticated.' });

    const existingUser = await selectUserById(sessionUser!.id!);

    if (!existingUser)
      return httpRes.notFound({
        message: 'User does not exist.',
      });

    const { groupSlug } = await params;

    const existingGroup = await selGroupBySlug(groupSlug);

    if (!existingGroup)
      return httpRes.notFound({ message: 'Group does not exist.' });

    const result = await selJoinRequest(sessionUser.id!);

    if (!result)
      return httpRes.ok({
        message: 'Join Request does not exist.',
      });

    return httpRes.ok({
      message: 'Join Request successfully retrieved.',
      data: result,
    });
  } catch (error: unknown) {
    return serverResponseError(error);
  }
}
