import { NextRequest } from 'next/server';

import { currentAuthUser } from '@/lib/nextauth';
import { insertGroup } from '@/db-access/insert';
import { queryFindUserByIdWithOwnedGroups } from '@/db-access/query';
import { selectGroupByName, selectAllGroups } from '@/db-access/select';
import {
  httpRes,
  nullIfEmptyArrOrStr,
  serverResponseError,
  zodValidate,
  zodValidatesearchParams,
} from '@/utils';
import {
  AllSearchParamsSchema,
  InsertGroupSchema,
  NameSearchParamsSchema,
} from '@/zod-schemas';

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

    let result;

    if (!hasSearchParams) {
      // console.log('running !hasSearchParams');
      const userWithOwnedGroups = await queryFindUserByIdWithOwnedGroups(
        sessionUser.id!,
      ); // TODO: should also query user's memberships

      if (!userWithOwnedGroups)
        return httpRes.notFound({ message: 'Account does not exist.' });

      result = {
        ownedGroups: userWithOwnedGroups?.ownedGroups,
        // TODO: should also include user's memberships
        // allGroups:
      };
    } else {
      const searchParams = req.nextUrl.searchParams;
      const searchParamsObj = Object.fromEntries(searchParams);

      //if using getter
      // const queryParamName = searchParams.get('name');

      const { searchGroupByParamName, searchGroupsByParamAll } =
        zodValidatesearchParams(
          {
            searchGroupByParamName: NameSearchParamsSchema,
            searchGroupsByParamAll: AllSearchParamsSchema,
          },
          searchParamsObj,
        );

      if (searchGroupByParamName.success) {
        // valid url query: ?name=some-string
        const existingGroup = await selectGroupByName(
          searchGroupByParamName.data!.name!,
        );
        if (!existingGroup)
          return httpRes.notFound({ message: 'Group name does not exist.' });

        result = existingGroup;
      } else if (searchGroupsByParamAll.success) {
        // valid url query: ?all=true
        const allGroups = await selectAllGroups();

        if (!allGroups)
          return httpRes.notFound({ message: 'No existing groups yet.' });

        result = allGroups;
      } else {
        return httpRes.badRequest({ message: 'Invalid URL query params.' });
      }
    }

    if (!result) return httpRes.notFound({ message: 'No result.' });

    // console.log('result===>', result);
    return httpRes.ok({
      message: 'Group/(s) successfully retrieved.',
      data: result,
    });
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

    // const existingUser = await selectUserById(sessionUser!.id!);

    // if (!existingUser)
    //   return httpRes.notFound({
    //     message: 'Account does not exist.',
    //   });

    const data = await req.json();

    const validation = zodValidate(InsertGroupSchema, data);

    if (!validation?.success)
      return httpRes.badRequest({ message: validation?.message });

    const { name } = validation.data;

    // need to check if group name already exists so that we can inform user why req failed, unless, we restrict user (on the client-side) from sending a request if there is a name conflict (e.g. disable "create group" button until user chooses another name)

    const existingGroup = await selectGroupByName(name);

    if (existingGroup)
      return httpRes.conflict({ message: 'Group Name already exists.' });

    const result = await insertGroup({
      ownerId: sessionUser.id!,
      ...validation.data,
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
// ----------------------------------------------------------------------------
