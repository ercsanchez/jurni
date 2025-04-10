import { currentAuthUser } from '@/lib/nextauth';
import { SelectUser } from '@/db/schema';
import { qryGroupById } from '@/db-access/query';
import { selectUserById, selectUsersByIds } from '@/db-access/select';
import { txInsMembershipsAndDelJoinReqsIfExists } from '@/db-access/transaction';
import { httpRes, serverResponseError, zodValidate } from '@/utils';
import { UserIdsSchema } from '@/zod-schemas';

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

    const existingGroup = await qryGroupById({
      groupId,
      whereEmployeeUserId: sessionUser.id,
    });

    if (!existingGroup) {
      console.log('running');
      return httpRes.notFound({ message: 'Group does not exist.' });
    }

    // current user is not the group owner
    if (sessionUser.id !== existingGroup.ownedBy) {
      const [currentUserEmployee] = existingGroup.employments;
      if (!currentUserEmployee) {
        return httpRes.forbidden({
          message:
            'Only the Group Owner or an Employee can create Memberships.',
        });
      }
    }

    const data = await req.json();

    const validation = zodValidate(UserIdsSchema, data);

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
    // console.log('existingUsers using sql statement=====>', existingUsers);

    if (!existingUsers) {
      return httpRes.badRequest({
        message: 'Users to add as Members do not exist.',
      });
    }

    const existingUserIds = (existingUsers as Array<SelectUser>).map(
      (i: SelectUser) => i.id,
    );
    // -------------------------------------------------------------------

    const result = await txInsMembershipsAndDelJoinReqsIfExists({
      userIds: existingUserIds,
      groupId,
      createdBy: sessionUser.id!,
    });

    // no result if memberships/(s) already exist
    if (!result)
      return httpRes.badRequest({
        message: 'Membership/(s) already exist.',
      });

    return httpRes.ok({
      message: 'Membership/(s) successfully created.',
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

    const existingGroup = await qryGroupById({
      groupId,
      withMembers: true,
    });

    if (!existingGroup)
      return httpRes.notFound({ message: 'Group does not exist.' });

    return httpRes.ok({
      message: 'Memberships successfully retrieved.',
      data: existingGroup.memberships,
    });
  } catch (error: unknown) {
    return serverResponseError(error);
  }
};

// export const DELETE = async function DELETE(
//   req: Request,
//   { params }: { params: Promise<{ groupId: string }> },
// ) {
//   console.log('running DELETE /groups/[id]/memberships');

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

//     const { groupId } = await params;

//     const existingGroup = await selectGroupById(groupId);

//     if (!existingGroup)
//       return httpRes.notFound({ message: 'Group does not exist.' });

//     const data = await req.json();

//     const validation = zodValidate(
//       UserIdsSchema,
//       data,
//     );

//     if (!validation?.success) {
//       return httpRes.badRequest({ message: validation?.message });
//     }

//     const result = await deleteMembershipsByIds({
//       userIds: validation.data.userIds,
//       groupId,
//     });

//     if (!result)
//       return httpRes.badRequest({
//         message: 'Membership/(s) to delete do not exist.',
//       });

//     return httpRes.ok({
//       message: 'Membership/(s) successfully deleted.',
//       data: result,
//     });
//   } catch (error: unknown) {
//     return serverResponseError(error);
//   }
// };
