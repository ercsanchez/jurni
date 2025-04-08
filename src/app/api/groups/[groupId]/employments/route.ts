import { currentAuthUser } from '@/lib/nextauth';
import { insertEmployments } from '@/db-access/insert';
import { queryFindGroupByIdWithEmployments } from '@/db-access/query';
import {
  selectGroupById,
  selectUserById,
  selectUsersByIds,
} from '@/db-access/select';
import { httpRes, serverResponseError, zodValidate } from '@/utils';
import { UserIdsSchema } from '@/zod-schemas';
import { SelectUser } from '@/db/schema';
import { deleteEmploymentsByIds } from '@/db-access/delete';

export const POST = async function POST(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
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

    if (existingGroup.ownerId !== sessionUser.id) {
      return httpRes.forbidden({
        message: 'Only the group owner can add employees.',
      });
    }

    const data = await req.json();

    const validation = zodValidate(UserIdsSchema, data);

    if (!validation?.success) {
      return httpRes.badRequest({ message: validation?.message });
    }

    const existingUsers = await selectUsersByIds(validation.data.userIds);
    // console.log('existingUsers using sql statement=====>', existingUsers);

    if (!existingUsers) {
      return httpRes.badRequest({
        message: 'Users to add as members do not exist.',
      });
    }

    const existingUserIds = (existingUsers as Array<SelectUser>).map(
      (i: SelectUser) => i.id,
    );

    const result = await insertEmployments({
      userIds: existingUserIds,
      groupId,
      addedBy: sessionUser.id!,
    });

    // no result if employment already exists
    if (!result)
      return httpRes.badRequest({
        message: 'Employment/(s) not created.',
      });

    return httpRes.ok({
      message: 'Employment/(s) successfully created.',
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

    if (existingGroup.ownerId !== sessionUser.id) {
      return httpRes.forbidden({
        message: 'Only the group owner can delete employees.',
      });
    }

    const data = await req.json();

    const validation = zodValidate(UserIdsSchema, data);

    if (!validation?.success) {
      return httpRes.badRequest({ message: validation?.message });
    }

    const result = await deleteEmploymentsByIds({
      userIds: validation.data.userIds,
      groupId,
    });

    if (!result)
      return httpRes.badRequest({
        message: 'Employments/(s) to delete do not exist.',
      });

    return httpRes.ok({
      message: 'Employments/(s) successfully deleted.',
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

    const existingGroupWithEmployments =
      await queryFindGroupByIdWithEmployments(groupId);

    if (!existingGroupWithEmployments)
      return httpRes.notFound({ message: 'Group does not exist.' });

    // current user is not the group owner
    if (sessionUser.id !== existingGroupWithEmployments.ownerId) {
      // check if current user is an employee
      const [currentUserEmployeeId] =
        existingGroupWithEmployments.employments.filter(
          (i) => i.userId === sessionUser.id,
        );
      if (!currentUserEmployeeId) {
        return httpRes.forbidden({
          message:
            'Only the group owner or an employee can get employee records.',
        });
      }
    }

    return httpRes.ok({
      message: 'Employee/(s) successfully retrieved.',
      data: existingGroupWithEmployments.employments,
    });
  } catch (error: unknown) {
    return serverResponseError(error);
  }
};
