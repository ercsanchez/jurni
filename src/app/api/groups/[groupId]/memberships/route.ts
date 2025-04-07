import { currentAuthUser } from '@/lib/nextauth';
import { insertMemberships } from '@/db-access/insert';
import { qryGroupById } from '@/db-access/query';
import {
  selectGroupById,
  selectUserById,
  selectUsersByIds,
} from '@/db-access/select';
import { httpRes, serverResponseError, zodValidate } from '@/utils';
import { InsertDeleteMembershipsEmploymentsSchema } from '@/zod-schemas';
import { SelectUser } from '@/db/schema';
import {
  // deleteMembershipById,
  deleteMembershipsByIds,
} from '@/db-access/delete';

export const POST = async function POST(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  console.log('running POST /groups/[id]/memberships');

  try {
    const sessionUser = await currentAuthUser();

    if (!sessionUser)
      return httpRes.unauthenticated({ message: 'User is not authenticated.' });

    const existingUser = await selectUserById(sessionUser!.id!);

    // need to also check if auth user is an employee of this group
    if (!existingUser)
      return httpRes.notFound({
        message: 'Account does not exist.',
      });

    const { groupId } = await params;

    const existingGroup = await selectGroupById(groupId);

    // console.log('existing group ======>', existingGroup);

    if (!existingGroup) {
      console.log('running');
      return httpRes.notFound({ message: 'Group does not exist.' });
    }

    const data = await req.json();

    const validation = zodValidate(
      InsertDeleteMembershipsEmploymentsSchema,
      data,
    );

    if (!validation?.success) {
      // console.error(new Error(`Zod Validation Error: ${validation.message}`));
      return httpRes.badRequest({ message: validation?.message });
    }

    // USING MULTIPLE FN CALLS --------------------------------------------
    // const existingUsers = await Promise.all(
    //   validation.data.userIds.map(async (userId: SelectUser['id']) => {
    //     const existingUser = await selectUserById(userId);
    //     return existingUser?.id;
    //   }),
    // );

    // const existingUserIds = existingUsers.filter((i) => Boolean(i)); // remove all null items (non-existent userId)

    // if (!nullIfEmptyArrOrStr(existingUserIds)) {
    //   return httpRes.badRequest({ message: 'Users to add as members do not exist.' });
    // }
    // -------------------------------------------------------------------

    // USING SQL OPERATOR ------------------------------------------------
    const existingUsers = await selectUsersByIds(validation.data.userIds);
    console.log('existingUsers using sql statement=====>', existingUsers);

    if (!existingUsers) {
      return httpRes.badRequest({
        message: 'Users to add as members do not exist.',
      });
    }

    const existingUserIds = (existingUsers as Array<SelectUser>).map(
      (i: SelectUser) => i.id,
    );
    // -------------------------------------------------------------------

    const result = await insertMemberships({
      userIds: existingUserIds,
      groupId,
      createdBy: sessionUser.id!,
    });

    // no result if membership already exists
    if (!result)
      return httpRes.badRequest({
        message: 'Membership/(s) not created.',
      });

    return httpRes.ok({
      message: 'Membership/(s) successfully created.',
      data: result,
    });
  } catch (error: unknown) {
    return serverResponseError(error);
  }
};

export const DELETE = async function DELETE(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  console.log('running DELETE /groups/[id]/memberships');

  try {
    const sessionUser = await currentAuthUser();

    if (!sessionUser)
      return httpRes.unauthenticated({ message: 'User is not authenticated.' });

    const existingUser = await selectUserById(sessionUser!.id!);

    // need to also check if auth user is an employee of this group
    if (!existingUser)
      return httpRes.notFound({
        message: 'Account does not exist.',
      });

    const { groupId } = await params;

    const existingGroup = await selectGroupById(groupId);

    if (!existingGroup)
      return httpRes.notFound({ message: 'Group does not exist.' });

    const data = await req.json();

    const validation = zodValidate(
      InsertDeleteMembershipsEmploymentsSchema,
      data,
    );

    if (!validation?.success) {
      return httpRes.badRequest({ message: validation?.message });
    }

    const result = await deleteMembershipsByIds({
      userIds: validation.data.userIds,
      groupId,
    });

    if (!result)
      return httpRes.badRequest({
        message: 'Membership/(s) to delete do not exist.',
      });

    return httpRes.ok({
      message: 'Membership/(s) successfully deleted.',
      data: result,
    });
  } catch (error: unknown) {
    return serverResponseError(error);
  }
};

export const GET = async function GET(
  _req: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  console.log('running GET /groups/[id]/memberships');

  try {
    const sessionUser = await currentAuthUser();

    if (!sessionUser)
      return httpRes.unauthenticated({ message: 'User is not authenticated.' });

    const existingUser = await selectUserById(sessionUser!.id!);

    if (!existingUser)
      return httpRes.notFound({
        message: 'User does not exist.',
      });

    const { groupId } = await params;

    // const existingGroupWithMemberships =
    //   await queryFindGroupByIdWithMemberships(groupId);
    const existingGroupWithMemberships = await qryGroupById({
      groupId,
      withMembers: true,
    });

    console.log(
      '------------------',
      existingGroupWithMemberships!['memberships'][1],
    );

    if (!existingGroupWithMemberships)
      return httpRes.notFound({ message: 'Group does not exist.' });

    return httpRes.ok({
      message: 'Memberships successfully retrieved.',
      data: existingGroupWithMemberships.memberships,
    });
  } catch (error: unknown) {
    return serverResponseError(error);
  }
};
