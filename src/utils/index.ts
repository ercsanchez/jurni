import {
  createDateObj,
  // getDateValues,
  // getUTCDateValues,
  getShiftedDateISOStringGivenTz,
  // getShiftedDatetimeISOStringGivenTimeAndTz,
  // getTzOffsetStrWithSign,
  // shiftUTCDateGivenTzOffset,
  // tzOffsetMinsToHhMm,
  // tzOffsetStrToMins,
  // tzOffsetStrToMs,
} from './datetime';
import { type DbAccessFn } from './defs';
import {
  capitalizeFirstChar,
  createUniqSlugWithSelQryBySlug,
  isEmptyObjOrStr,
  nullIfEmptyArrOrStr,
  nullIfEmptyObjOrStr,
  // padLeftWithOneZero,
  // padLeftWithTwoZeroes,
  queryDataWithBigintToStr,
  slugify,
} from './general';
import getEnvValue from './get-env-value';
import {
  httpRes,
  httpResConfig,
  httpResByStatus,
  serverResponseError,
} from './http-response';
import { comparePassword, hashPassword, hashPasswordSync } from './password';
import queryDbWithSearchParams from './query-db-with-search-params';
import { zodValidate, zodValidateSearchParams } from './zod-validate';

export {
  // datetime -----------------------------
  createDateObj,
  // getDateValues,
  // getUTCDateValues,
  getShiftedDateISOStringGivenTz,
  // getShiftedDatetimeISOStringGivenTimeAndTz,
  // getTzOffsetStrWithSign,
  // shiftUTCDateGivenTzOffset,
  // tzOffsetMinsToHhMm,
  // tzOffsetStrToMins,
  // tzOffsetStrToMs,

  // defs -----------------------------
  type DbAccessFn,

  // general -----------------------------
  capitalizeFirstChar,
  createUniqSlugWithSelQryBySlug,
  isEmptyObjOrStr,
  nullIfEmptyArrOrStr,
  nullIfEmptyObjOrStr,
  // padLeftWithOneZero,
  // padLeftWithTwoZeroes,
  queryDataWithBigintToStr,
  slugify,

  // get-env-value
  getEnvValue,

  // http-response
  httpRes,
  httpResConfig,
  httpResByStatus,
  serverResponseError,

  // password -----------------------------
  comparePassword,
  hashPassword,
  hashPasswordSync,

  // query-db-with-search-params -----------------------------
  queryDbWithSearchParams,

  // zod-validate
  zodValidateSearchParams,
  zodValidate,
};
