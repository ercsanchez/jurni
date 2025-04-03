import { type SearchParamsDbAccess, type UrlSearchParams } from './defs';
import { zodValidateSearchParams } from './zod-validate';

export default async function queryDbWithSearchParams({
  dbAccess,
  searchParams,
}: {
  dbAccess: SearchParamsDbAccess;
  searchParams: UrlSearchParams;
}) {
  const searchParamsDbAccessEntries = Object.entries(dbAccess);

  const schemas = searchParamsDbAccessEntries.reduce((acc, [k, v]) => {
    Object.assign(acc, { [k]: v['schema'] });
    return acc;
  }, {}); // => { schemaKey: ZodSchema }

  const validation = zodValidateSearchParams(schemas, searchParams);

  const {
    success,
    data: zodValidatedSearchParams, // => undefined if validation failed
    message,
    schemaKey,
  } = validation;

  if (!success)
    return {
      success,
      message,
      responseType: 'badRequest',
    };

  const dbQueryFn = dbAccess[schemaKey!].fn;

  try {
    const result = await dbQueryFn({ ...zodValidatedSearchParams });

    // unnecessary | dbQueryFn always returns null/undefined if no result
    // const validResult =
    //   result instanceof Array ? nullIfEmptyArrOrStr(result) : result;

    // query succeeded but no result returned (null or undefined returned from db-access fn)
    if (!result)
      return {
        success: true,
        message: dbAccess[schemaKey!].noResultMsg,
        responseType: 'ok',
      };

    return { success: true, data: result, responseType: 'ok' };
  } catch (err: unknown) {
    console.error(err);
  }
}
