import { DEFAULT_TIMEZONE_OFFSET } from '@/config/constants';
import { insGroupSession } from '@/db-access/insert';
import { qryGroupById } from '@/db-access/query';
import { selectGroupById, selectUserById } from '@/db-access/select';
import { updateGroupSession } from '@/db-access/update';
import { currentAuthUser } from '@/lib/nextauth';
import {
  httpRes,
  httpResByStatus,
  serverResponseError,
  zodValidate,
} from '@/utils';
import {
  InsertGroupSessionSchema,
  UpdateGroupSessionSchema,
} from '@/zod-schemas';

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

    if (!existingGroup) {
      return httpRes.notFound({ message: 'Group does not exist.' });
    }

    if (existingGroup.ownedBy !== sessionUser.id) {
      return httpRes.forbidden({
        message: 'Only the Group Owner can add Session/(s).',
      });
    }

    const data = await req.json();

    const validation = zodValidate(InsertGroupSessionSchema, data);

    if (!validation?.success) {
      return httpRes.badRequest({ message: validation?.message });
    }

    const { name, day, startAt, endAt, timezoneOffset } = data;
    const tzOffset = timezoneOffset
      ? timezoneOffset
      : existingGroup.defaultTimezoneOffset
        ? existingGroup.defaultTimezoneOffset
        : DEFAULT_TIMEZONE_OFFSET;

    const result = await insGroupSession({
      groupId,
      name,
      day,
      startAt,
      endAt,
      createdBy: sessionUser.id,
      timezoneOffset: tzOffset,
    });

    // no result if Session/(s) already exists
    if (!result)
      return httpRes.badRequest({
        message: 'Session/(s) not created. Already exist / Invalid inputs.',
      });

    return httpRes.ok({
      message: 'Session/(s) successfully created.',
      data: result,
    });
  } catch (error: unknown) {
    return serverResponseError(error);
  }
};

export const PATCH = async function PATCH(
  req: Request,
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

    const data = await req.json();

    const validation = zodValidate(UpdateGroupSessionSchema, data);

    if (!validation?.success)
      return httpRes.badRequest({ message: validation?.message });

    const existingGroup = await qryGroupById({
      groupId,
      whereGroupSessionId: validation.data.id,
    });

    if (!existingGroup)
      return httpRes.notFound({ message: 'Group does not exist.' });

    if (existingGroup.ownedBy !== sessionUser.id)
      return httpRes.forbidden({
        message: 'Only the Group Owner can edit a Session.',
      });

    const [existingGroupSession] = existingGroup.groupSessions;

    if (!existingGroupSession || existingGroupSession.groupId !== groupId)
      return httpRes.badRequest({
        message:
          "Group Session doesn't exist or Session does not belong to the Group.",
      });

    // TODO: create a function to compare all fields in validation.data to existingSession | use Object.entries then .every
    const { name, active } = validation.data;
    const { name: existingName, active: existingActive } = existingGroupSession;

    if (name === existingName && active === existingActive)
      // updateGroupSession still returns the existing session even if no change in the fields
      // lastEditedAt will be edited even if no actual update, so we need to check if there are actual changes before running updateGroupSession
      return httpRes.badRequest({
        message: 'Data is the same to Database record.',
      });

    const result = await updateGroupSession(validation.data);

    if (!result)
      return httpResByStatus({
        status: 422,
        message: 'Session could not be updated.',
      });

    return httpRes.ok({
      message: 'Session successfully updated.',
      data: result,
    });
  } catch (error) {
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
      withGroupSessions: true,
    });

    if (!existingGroup)
      return httpRes.notFound({ message: 'Group does not exist.' });

    // don't send failed response if no existing Sessions
    return httpRes.ok({
      message: 'Session/(s) successfully retrieved.',
      data: existingGroup.groupSessions,
    });
  } catch (error: unknown) {
    return serverResponseError(error);
  }
};
