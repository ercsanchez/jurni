import { z } from 'zod';

export interface UrlSearchParams {
  [key: string]: string;
}

export interface SearchParamsSchemas {
  [key: string]: z.ZodType;
}

export type DbAccessFn = (
  // ...params: Array<any> // ts-eslint error
  // ...params: Array<object> // doesn't work
  param: { [key: string]: string } | string | number, // if only passing 1 arg |  we assume fn params[] can expect an object so that we can destructure
  // ...params: Array<{ [key: string]: string } | string | number> // if expecting multiple args with diff. types
) => Promise<object | Array<object> | undefined | null>;

export interface SearchParamsDbAccess {
  [key: string]: {
    schema: z.ZodType;
    noResultMsg?: string;
    fn: DbAccessFn;
  };
}

export interface ValidationResult {
  success: boolean;
  message?: string;
  data?: { [key: string]: string };
  // FIX THIS
  schemaKey?: string;
}
