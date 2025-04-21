import { currentAuthUser } from '@/lib/nextauth';
import { qryFindGroupBySlugWithOwner } from '@/db-access/query';
import {
  selGroupBySlug,
  selectGroupByName,
  selectUserById,
} from '@/db-access/select';
import { upGroup } from '@/db-access/update';
import {
  httpRes,
  zodValidate,
  serverResponseError,
  createUniqSlugWithSelQryBySlug,
  slugify,
} from '@/utils';
import { UpdateGroupSchema } from '@/zod-schemas';
import { TableRecord } from '@/db/scripts/seed-generate';

export const PATCH = async function PATCH(
  req: Request,
  { params }: { params: Promise<{ groupSlug: string }> },
) {
  console.log('running PATCH api/groups');

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

    const validation = zodValidate(UpdateGroupSchema, data);

    if (!validation?.success) {
      // console.error(new Error(`Zod Validation Error: ${validation.message}`));
      return httpRes.badRequest({ message: validation?.message });
    }

    const { groupSlug } = await params;

    const existingGroup: TableRecord | undefined =
      await qryFindGroupBySlugWithOwner({
        slug: groupSlug,
        withOwner: true,
      });

    if (!existingGroup)
      return httpRes.notFound({ message: 'Group does not exist.' });

    if (existingGroup.ownedBy !== sessionUser.id)
      return httpRes.forbidden({
        message: `Only the Group Owner is allowed to update the Group's details.`,
      });

    const changesExist = Object.entries(validation.data).some(([k, v]) => {
      console.log('=====>', existingGroup[k], v);
      return existingGroup[k] !== v;
    });

    // only update if there are changes to the group's details (e.g. name)
    if (!changesExist)
      return httpRes.ok({ message: 'No changes from DB record.' });

    const { name } = validation.data;

    const existingGroupWithDuplicateName = await selectGroupByName({ name });

    if (existingGroupWithDuplicateName)
      return httpRes.conflict({ message: 'Group Name already exists.' });

    const nameChange = name !== existingGroup.name;
    const uniqueSlug = slugify(name);
    const recreateSlug = existingGroup.slug !== uniqueSlug;
    const nameChangeData = !nameChange
      ? {}
      : recreateSlug
        ? {
            name,
            slug: await createUniqSlugWithSelQryBySlug({
              str: name,
              fn: selGroupBySlug,
            }),
          }
        : { name }; // no need to update slug since slug generated from the new name is already the one set for this group

    const result = await upGroup({
      id: existingGroup.id as number,
      ownedBy: sessionUser.id!,

      ...nameChangeData,

      // ...validation.data,
      // need this if zodValidate return value is typed
      // name: validation.data!.name,
      // ...(validation.data as { name: string }),
    });

    // result is null if group doesn't exist
    if (!result)
      return httpRes.badRequest({
        message: 'Group failed to update.',
      });

    return httpRes.ok({
      message: 'Group was successfully updated.',
      data: result,
    });
  } catch (error: unknown) {
    return serverResponseError(error);
  }
};
