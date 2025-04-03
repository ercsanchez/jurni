import { type DbAccessFn } from './defs';
import { capitalizeFirstChar, nullIfEmptyArrOrStr } from './general';
import getEnvValue from './get-env-value';
import queryDbWithSearchParams from './query-db-with-search-params';
import {
  httpRes,
  httpResConfig,
  httpResByStatus,
  serverResponseError,
} from './http-response';
import { hashPassword, comparePassword } from './password';
import { zodValidate, zodValidateSearchParams } from './zod-validate';

export {
  capitalizeFirstChar,
  comparePassword,
  getEnvValue,
  hashPassword,
  httpRes,
  httpResConfig,
  httpResByStatus,
  nullIfEmptyArrOrStr,
  queryDbWithSearchParams,
  serverResponseError,
  zodValidateSearchParams,
  zodValidate,
  type DbAccessFn,
};
