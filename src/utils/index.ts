import { type DbAccessFn } from './defs';
import {
  appendTz,
  capitalizeFirstChar,
  isEmptyObjOrStr,
  nullIfEmptyArrOrStr,
  nullIfEmptyObjOrStr,
} from './general';
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
  appendTz,
  capitalizeFirstChar,
  comparePassword,
  getEnvValue,
  hashPassword,
  isEmptyObjOrStr,
  httpRes,
  httpResConfig,
  httpResByStatus,
  nullIfEmptyArrOrStr,
  nullIfEmptyObjOrStr,
  queryDbWithSearchParams,
  serverResponseError,
  zodValidateSearchParams,
  zodValidate,
  type DbAccessFn,
};
