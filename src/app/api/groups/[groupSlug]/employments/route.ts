import { currentAuthUser } from '@/lib/nextauth';
import { insEmployments } from '@/db-access/insert';
import { SelectUser } from '@/db/schema';
import { qryGroupBySlug } from '@/db-access/query';
import {
  selGroupBySlug,
  selectUserById,
  selectUsersByIds,
} from '@/db-access/select';
import { httpRes, serverResponseError, zodValidate } from '@/utils';
import { UserIdsSchema } from '@/zod-schemas';

export const POST = async function POST(
  req: Request,
  { params }: { params: Promise<{ groupSlug: string }> },
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

    const { groupSlug } = await params;

    const existingGroup = await selGroupBySlug(groupSlug);
    const groupId = existingGroup.id;

    // console.log('existing group ======>', existingGroup);

    if (!existingGroup) {
      return httpRes.notFound({ message: 'Group does not exist.' });
    }

    if (existingGroup.ownedBy !== sessionUser.id) {
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
        message: 'Users to add as Employees do not exist.',
      });
    }

    const existingUserIds = (existingUsers as Array<SelectUser>).map(
      (i: SelectUser) => i.id,
    );

    const result = await insEmployments({
      userIds: existingUserIds,
      groupId,
      createdBy: sessionUser.id,
    });

    // no result if employment already exists
    if (!result)
      return httpRes.badRequest({
        message: 'Employment/(s) already exist.',
      });

    return httpRes.ok({
      message: 'Employment/(s) successfully created.',
      data: result,
    });
  } catch (error: unknown) {
    return serverResponseError(error);
  }
};

export const GET = async function GET(
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

    // const existingGroupWithEmployments =
    //   await queryFindGroupByIdWithEmployments(groupId);

    const existingGroup = await qryGroupBySlug({
      groupSlug,
      whereEmployeeUserId: sessionUser.id,
    });

    if (!existingGroup)
      return httpRes.notFound({ message: 'Group does not exist.' });

    // current user is not the group owner
    if (sessionUser.id !== existingGroup.ownedBy) {
      // check if current user is an employee
      const [currentUserEmployee] = existingGroup.employments;
      if (!currentUserEmployee) {
        return httpRes.forbidden({
          message:
            'Only the group owner or an employee can get employee records.',
        });
      }
    }

    // don't send failed response if no existing employees
    return httpRes.ok({
      message: 'Employee/(s) successfully retrieved.',
      data: existingGroup.employments,
    });
  } catch (error: unknown) {
    return serverResponseError(error);
  }
};

// export const DELETE = async function DELETE(
//   req: Request,
//   { params }: { params: Promise<{ groupSlug: string }> },
// ) {
//   try {
//     const sessionUser = await currentAuthUser();

//     if (!sessionUser)
//       return httpRes.unauthenticated({ message: 'User is not authenticated.' });

//     const existingUser = await selectUserById(sessionUser!.id!);

//     // need to also check if auth user is an employee of this group
//     if (!existingUser)
//       return httpRes.notFound({
//         message: 'Account does not exist.',
//       });

//     const { groupSlug } = await params;

//     const existingGroup = await selGroupBySlug(groupSlug);

//     if (!existingGroup)
//       return httpRes.notFound({ message: 'Group does not exist.' });

//     if (existingGroup.ownedBy !== sessionUser.id) {
//       return httpRes.forbidden({
//         message: 'Only the group owner can delete employees.',
//       });
//     }

//     const data = await req.json();

//     const validation = zodValidate(UserIdsSchema, data);

//     if (!validation?.success) {
//       return httpRes.badRequest({ message: validation?.message });
//     }

//     const result = await deleteEmploymentsByIds({
//       userIds: validation.data.userIds,
//       groupId,
//     });

//     if (!result)
//       return httpRes.badRequest({
//         message: 'Employments/(s) to delete do not exist.',
//       });

//     return httpRes.ok({
//       message: 'Employments/(s) successfully deleted.',
//       data: result,
//     });
//   } catch (error: unknown) {
//     return serverResponseError(error);
//   }
// };
