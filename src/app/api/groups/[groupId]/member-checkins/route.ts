import { NextRequest } from 'next/server';

import { DEFAULT_TIMEZONE_OFFSET } from '@/config/constants';
import { SelectMembership } from '@/db/schema';
import { insMemberCheckins } from '@/db-access/insert';
import { qryGroupById } from '@/db-access/query';
import {
  selectGroupById,
  selectUserById,
  selMemberCheckinsByGrpIdWherePeriodOrSessionIds,
  selMembershipsByUserIdsGroupId,
} from '@/db-access/select';
import { upMemberCheckins } from '@/db-access/update';
import { currentAuthUser } from '@/lib/nextauth';
import {
  getShiftedDateISOStringGivenTz,
  httpRes,
  nullIfEmptyArrOrStr,
  serverResponseError,
  zodValidate,
} from '@/utils';
import {
  InsertMemberCheckinsSchema,
  MemberCheckinsSearchParamsSchema,
  UpdateMemberCheckinsSchema,
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

    const data = await req.json();

    const validation = zodValidate(InsertMemberCheckinsSchema, data);

    if (!validation?.success) {
      return httpRes.badRequest({ message: validation?.message });
    }

    const { userIds, sessionId, createdAt } = validation.data;

    const existingGroup = await qryGroupById({
      groupId,
      whereEmployeeUserId: sessionUser.id,
      whereGroupSessionId: sessionId,
    });

    if (!existingGroup) {
      return httpRes.notFound({ message: 'Group does not exist.' });
    }

    const [existingGroupSession] = existingGroup.groupSessions;

    if (!existingGroupSession)
      return httpRes.badRequest({ message: 'Group Session does not exist.' });

    // if (sessionUser.id !== existingGroup.ownedBy) {
    //   const [currentUserEmployee] = existingGroup.employments;
    //   if (!currentUserEmployee) {
    //     return httpRes.forbidden({
    //       message:
    //         'Only the Group Owner or an Employee can insert Member Checkins to this endpoint.',
    //     });
    //   }
    // }

    const [currentUserEmployee] = existingGroup.employments;

    const tzOffset = existingGroupSession.timezoneOffset
      ? existingGroupSession.timezoneOffset
      : existingGroup.defaultTimezoneOffset
        ? existingGroup.defaultTimezoneOffset
        : DEFAULT_TIMEZONE_OFFSET;

    let result;

    if (sessionUser.id === existingGroup.ownedBy || currentUserEmployee) {
      // user is a group owner or employee
      const existingMembers = await selMembershipsByUserIdsGroupId({
        userIds,
        groupId,
      });

      if (!existingMembers)
        return httpRes.badRequest({
          message: 'Memberships do not exist for the User Ids passed',
        });

      const existingMemberUserIds = (
        existingMembers as Array<SelectMembership>
      ).map((i: SelectMembership) => i.userId);

      result = await insMemberCheckins({
        groupId,
        createdBy: sessionUser.id!,
        confirmed: true,
        confirmedBy: sessionUser.id!, // automatically confirmed if created by owner/employee
        timezoneOffset: tzOffset,
        // req body data
        userIds: existingMemberUserIds,
        sessionId,
        createdAt,
      });
    } else {
      // user is not an owner or employee
      if (userIds.length > 1) {
        return httpRes.forbidden({
          message:
            'Only the Group Owner or an Employee can check in multiple Users.',
        });
      }

      if (createdAt) {
        return httpRes.forbidden({
          message:
            'Only the Group Owner or an Employee can specify a Checkin date that is different from today.',
        });
      }

      result = await insMemberCheckins({
        groupId,
        createdBy: sessionUser.id!,
        timezoneOffset: tzOffset,
        // req body data
        userIds,
        sessionId,
        // createdAt, // do not allow for non-employee
      });
    }

    // no result if Checkin/(s) already exist
    if (!result)
      return httpRes.badRequest({
        message:
          'No Member Checkin/(s) created. / Member Checkin/(s) already exist for the Group Session for the specified date.',
      });

    return httpRes.ok({
      message: 'Member Checkin/(s) successfully created.',
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

    const existingGroup = await qryGroupById({
      groupId,
      whereEmployeeUserId: sessionUser.id,
    });

    if (!existingGroup) {
      return httpRes.notFound({ message: 'Group does not exist.' });
    }

    if (sessionUser.id !== existingGroup.ownedBy) {
      const [currentUserEmployee] = existingGroup.employments;
      if (!currentUserEmployee) {
        return httpRes.forbidden({
          message:
            'Only the Group Owner or an Employee can update Member Checkin/(s) via this endpoint.',
        });
      }
    }

    const data = await req.json();

    const validation = zodValidate(UpdateMemberCheckinsSchema, data);

    if (!validation?.success)
      return httpRes.badRequest({ message: validation?.message });

    const { confirmed, ids } = validation.data;

    // const confirmedBy = confirmed
    //   ? sessionUser.id
    //   : Object.is(confirmed, null)
    //     ? null
    //     : undefined;

    const confirmationData = Object.is(confirmed, null)
      ? { confirmed: null, confirmedBy: null }
      : typeof confirmed === 'boolean'
        ? {
            confirmed,
            confirmedBy: sessionUser.id,
          }
        : {}; // confirmed is undefined

    const result = await upMemberCheckins({
      ids,
      ...confirmationData,
    });

    if (!result)
      return httpRes.badRequest({
        message: 'Updates to Member Checkin/(s) could not be made.',
      });

    return httpRes.ok({
      message: 'Member Checkin/(s) successfully updated.',
      data: result,
    });
  } catch (error) {
    return serverResponseError(error);
  }
};

export const GET = async function GET(
  req: NextRequest,
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

    const existingGroup = await selectGroupById(groupId);

    if (!existingGroup)
      return httpRes.notFound({ message: 'Group does not exist.' });

    // hasSearchParams is true when path?char (>= 1 char after ?) and false when path? or path (w/o ?)
    const hasSearchParams = nullIfEmptyArrOrStr(req.nextUrl.search);

    if (!hasSearchParams) {
      // IF NO SEARCH PARAMS, GET ALL OF TODAY'S CHECKINS FOR ALL SESSIONS FOR THE GROUP

      const todayDatePlusGroupOffset = getShiftedDateISOStringGivenTz(
        existingGroup.defaultTimezoneOffset ?? DEFAULT_TIMEZONE_OFFSET,
        new Date(),
      );

      // if no search params, we only query records dated today (server date + tz offset)
      const result = await selMemberCheckinsByGrpIdWherePeriodOrSessionIds({
        groupId,
        begDate: todayDatePlusGroupOffset,
      });

      // console.log('result-------', datePlusGroupOffset, result);

      if (!result)
        return httpRes.ok({
          message: 'No Member Checkin/(s), yet, for today.',
        });

      // don't send failed response if no existing Sessions
      return httpRes.ok({
        message: 'Member Checkin/(s), for today, successfully retrieved.',
        data: result,
      });
    } else {
      // GET CHECKINS FOR A SPECIFIC PERIOD FOR EITHER A SPECIFIC SESSION/(S) OR ALL SESSIONS

      const searchParams = Object.fromEntries(req.nextUrl.searchParams);

      // sessionIds is an encoded URI comp if it is an array
      const decodedSearchParam = decodeURIComponent(searchParams.sessionIds);

      const sessionIdsArr = decodedSearchParam.includes('[')
        ? JSON.parse(decodedSearchParam)
        : searchParams.sessionIds;

      // console.log(
      //   'searchParamsObj',
      //   Array.isArray(sessionIdsArr),
      //   sessionIdsArr,
      // );

      const searchParamsObj = {
        ...searchParams,
        sessionIds: sessionIdsArr,
      };

      const validation = zodValidate(
        MemberCheckinsSearchParamsSchema,
        searchParamsObj,
      );

      // TODO: try using queryDbWithSearchParams here

      if (!validation?.success)
        return httpRes.badRequest({ message: validation?.message });

      const { begDate, endDate, sessionIds } = validation.data;

      const result = await selMemberCheckinsByGrpIdWherePeriodOrSessionIds({
        groupId,
        begDate,
        endDate,
        sessionIds,
      });

      if (!result)
        return httpRes.ok({
          message:
            'Member Checkin/(s), for the period and the specifc Session/(s), do not exist.',
        });

      // don't send failed response if no existing Sessions
      return httpRes.ok({
        message:
          'Member Checkin/(s), for the period and the specifc Session/(s), successfully retrieved.',
        data: result,
      });
    }
  } catch (error: unknown) {
    return serverResponseError(error);
  }
};
