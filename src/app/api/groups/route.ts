import { NextRequest } from 'next/server';

import { currentAuthUser } from '@/lib/nextauth';
import { insertGroup } from '@/db-access/insert';
import { queryFindUserByIdWithOwnedGroups } from '@/db-access/query';
import {
  selectAllGroups,
  selectGroupByName,
  selectUserById,
} from '@/db-access/select';
import {
  queryDbWithSearchParams,
  httpRes,
  nullIfEmptyArrOrStr,
  serverResponseError,
  zodValidate,
  type DbAccessFn,
} from '@/utils';
import {
  AllSearchParamsSchema,
  InsertGroupSchema,
  NameSearchParamsSchema,
} from '@/zod-schemas';

// valid search queries: ?all=true | ?name=group-name
export const GET = async function GET(req: NextRequest) {
  console.log('running GET api/groups');

  try {
    const sessionUser = await currentAuthUser();

    if (!sessionUser)
      return httpRes.unauthenticated({ message: 'User is not authenticated.' });

    // hasSearchParams is true when path?char (>= 1 char after ?) and false when path? or path (w/o ?)
    // const hasSearchParams = req.nextUrl.search.length > 0;
    const hasSearchParams = nullIfEmptyArrOrStr(req.nextUrl.search);
    // console.log('hasSearchParams====>', hasSearchParams, req.nextUrl);

    if (!hasSearchParams) {
      const userWithOwnedGroups = await queryFindUserByIdWithOwnedGroups(
        sessionUser.id!,
      ); // TODO: should also query user's memberships

      if (!userWithOwnedGroups)
        return httpRes.notFound({ message: 'User does not exist.' });

      return httpRes.ok({
        message: 'User and his/her Group/(s) successfully retrieved.',
        data: {
          ownedGroups: userWithOwnedGroups?.ownedGroups,
          // TODO: should also include user's memberships
          // allGroups:
        },
      });
    } else {
      const searchParams = req.nextUrl.searchParams;
      const searchParamsObj = Object.fromEntries(searchParams);

      // if using getter
      // const queryParamName = searchParams.get('name');

      const dbAccess = {
        // search group by name (param: name=group-name)
        nameSearchParamsSchema: {
          schema: NameSearchParamsSchema,
          noResultMsg: 'Group not found.',
          fn: selectGroupByName as DbAccessFn,
        },
        // search all groups (param: all=true)
        allSearchParamsSchema: {
          schema: AllSearchParamsSchema,
          noResultMsg: 'No existing groups yet.',
          fn: selectAllGroups,

          // selectAllGroups doesn't receive any params so need to do it this way because fn will always be passed the searchParams obj as arg
          // no need to specify args or check if all=true since zodValidate will take care of search params validation
          // fn: (args: { all: true }) => args.all && selectAllGroups(),
        },
      };

      const result = await queryDbWithSearchParams({
        dbAccess,
        searchParams: searchParamsObj,
      });

      if (!result!.success) {
        return httpRes[result!.responseType!]({
          message: result!.message!,
        });
      }

      return httpRes.ok({
        message: result!.message ?? 'Group/(s) successfully retrieved.',
        data: result!.data,
      });
    }
  } catch (error: unknown) {
    return serverResponseError(error);
  }
};

export const POST = async function POST(req: Request) {
  console.log('running POST api/groups');

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

    const validation = zodValidate(InsertGroupSchema, data);

    if (!validation?.success)
      return httpRes.badRequest({ message: validation?.message });

    const { name } = validation.data!;

    // need to check if group name already exists so that we can inform user why req failed, unless, we restrict user (on the client-side) from sending a request if there is a name conflict (e.g. disable "create group" button until user chooses another name)

    const existingGroup = await selectGroupByName({ name });

    if (existingGroup)
      return httpRes.conflict({ message: 'Group Name already exists.' });

    const result = await insertGroup({
      ownerId: sessionUser.id!,
      name,
      // ...(validation.data! as { name: string; } // also works | ts doesn't know the form of ...(someVar) so need to typecast
    });

    if (!result)
      return httpRes.badRequest({
        message: 'Group was not created.',
      });

    return httpRes.ok({
      message: 'Group successfully created.',
      data: result,
    });
  } catch (error: unknown) {
    return serverResponseError(error);
  }
};

// self-defined validation ----------------------------------------------------
// const groupName = searchParams.get('name'); // => null if key doesn't exist
// const groupNameIsValid =
//   typeof groupName === 'string' && groupName.length > 0;

// const includeAllGroups = searchParams.get('all');
// const includeAllGroupsIsValid =
//   includeAllGroups === 'true' || includeAllGroups === 'false';

// // validSearchParams is true when searchParam exists in the url and value is not empty string
// const validSearchParams =
//   groupNameIsValid || includeAllGroupsIsValid ? true : false;

// // console.log('validSearchParams====>', validSearchParams);

// // false if invalid url query param or if no query param value (e.g. ?name or ?name=) | true if no query param (e.g. ?)

// if (!validSearchParams)
//   return httpRes.badRequest({ message: 'Invalid URL query.' });

// if (groupNameIsValid) {
//   const existingGroup = await selectGroupByName(groupName!);
//   if (!existingGroup)
//     return httpRes.notFound({ message: 'Group name does not exist.' });

//   result = existingGroup;
// } else if (includeAllGroupsIsValid) {
//   const allGroups = await selectAllGroups();

//   if (!allGroups)
//     return httpRes.notFound({ message: 'No existing groups yet.' });
//   result = allGroups;
// }
// -------------------------------------------------------------------------
