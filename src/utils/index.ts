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
  isEmptyObjOrStr,
  nullIfEmptyArrOrStr,
  nullIfEmptyObjOrStr,
  // padLeftWithOneZero,
  // padLeftWithTwoZeroes,
  queryDataWithBigintToStr,
} from './general';
import getEnvValue from './get-env-value';
import queryDbWithSearchParams from './query-db-with-search-params';
import {
  httpRes,
  httpResConfig,
  httpResByStatus,
  serverResponseError,
} from './http-response';
import { comparePassword, hashPassword, hashPasswordSync } from './password';
import { zodValidate, zodValidateSearchParams } from './zod-validate';

export {
  capitalizeFirstChar,
  comparePassword,
  getEnvValue,
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

  // general -----------------------------
  // padLeftWithOneZero,
  // padLeftWithTwoZeroes,
  queryDataWithBigintToStr,

  // password -----------------------------
  hashPassword,
  hashPasswordSync,
};
