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
  // params: { [key: string]: string }, // if only passing 1 arg
  // ...params: Array<{ [key: string]: string } | string | number> // if expecting multiple args with diff. types
  ...params: Array<{ [key: string]: string }> // we assume fn expects an object so that we can destructure
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
