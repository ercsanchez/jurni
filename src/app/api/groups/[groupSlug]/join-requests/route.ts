import { currentAuthUser } from '@/lib/nextauth';
import { SelectUser } from '@/db/schema';
import { qryGroupBySlug } from '@/db-access/query';
import { selUserById, selUsersByIds } from '@/db-access/select';
import { txDelJoinReqsThenInsMemberships } from '@/db-access/transaction';
import { upJoinRequests } from '@/db-access/update';
import { httpRes, serverResponseError, zodValidate } from '@/utils';
import { EvaluateJoinRequestsSchema } from '@/zod-schemas';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ groupSlug: string }> },
) {
  try {
    const sessionUser = await currentAuthUser();
    if (!sessionUser)
      return httpRes.unauthenticated({ message: 'User is not authenticated.' });

    const existingUser = await selUserById(sessionUser!.id!);

    if (!existingUser)
      return httpRes.notFound({
        message: 'Current Auth User does not exist.',
      });

    const { groupSlug } = await params;

    const existingGroup = await qryGroupBySlug({
      groupSlug,
      whereEmployeeUserId: sessionUser.id,
    });

    if (!existingGroup)
      return httpRes.notFound({ message: 'Group does not exist.' });

    const { id: groupId } = existingGroup;

    // current user is not the group owner
    if (sessionUser.id !== existingGroup.ownedBy) {
      const [currentUserEmployee] = existingGroup.employments;
      if (!currentUserEmployee) {
        return httpRes.forbidden({
          message:
            'Only the Group Owner or an Employee can evaluate the Join Requests.',
        });
      }
    }

    const data = await req.json();

    const validation = zodValidate(EvaluateJoinRequestsSchema, data);

    if (!validation?.success) {
      return httpRes.badRequest({ message: validation?.message });
    }

    const { userIds, confirmed } = validation.data;

    const existingUsers = await selUsersByIds(userIds);

    if (!existingUsers) {
      return httpRes.badRequest({
        message: 'All of the Users, to confirm Join Requests, do not exist.',
      });
    }

    const existingUserIds = (existingUsers as Array<SelectUser>).map(
      (i: SelectUser) => i.id,
    );

    let membershipsCreationMsg, result;
    if (confirmed) {
      membershipsCreationMsg = ' Memberships successfully created.';

      result = await txDelJoinReqsThenInsMemberships({
        userIds: existingUserIds,
        groupId,
        createdBy: sessionUser.id!,
      });
    } else {
      // employee/owner rejects Join Requests (confirmed = false) | employee/owner can also remove the Join Request's evaluation (confirmed = null)
      membershipsCreationMsg = '';

      result = await upJoinRequests({
        userIds: existingUserIds,
        groupId,
        confirmed,
        evaluatedBy: sessionUser.id!,
      });
    }

    if (!result)
      return httpRes.badRequest({
        message: `Join Requests not evaluated.`,
      });

    return httpRes.ok({
      message:
        `Join Requests successfully ${confirmed ? 'deleted' : 'rejected or unevaluated'}.` +
        membershipsCreationMsg,
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

    const existingUser = await selUserById(sessionUser!.id!);

    if (!existingUser)
      return httpRes.notFound({
        message: 'User does not exist.',
      });

    const { groupSlug } = await params;

    // query group with current auth user's unconfirmed join request
    const existingGroup = await qryGroupBySlug({
      groupSlug,
      whereEmployeeUserId: sessionUser.id,
      withJoinReqs: true,
    });

    if (!existingGroup)
      return httpRes.notFound({ message: 'Group does not exist.' });

    // current user is not the group owner
    if (sessionUser.id !== existingGroup.ownedBy) {
      const [currentUserEmployee] = existingGroup.employments;
      if (!currentUserEmployee) {
        return httpRes.forbidden({
          message:
            'Only the group Owner or an Employee can get the Join Requests.',
        });
      }
    }

    const result = existingGroup.joinRequests;

    if (result.length === 0)
      return httpRes.ok({
        message: 'No existing Join Requests for the Group.',
      });

    return httpRes.ok({
      message: 'Join Requests successfully retrieved.',
      data: result,
    });
  } catch (error: unknown) {
    return serverResponseError(error);
  }
}
