// returns original value if not an Array or string
export function nullIfEmptyArrOrStr(arg: Array<unknown> | string | unknown) {
  if (typeof arg === 'string' || Array.isArray(arg)) {
    return arg.length > 0 ? arg : null;
  }
  return arg;
}

// https://github.com/angus-c/just/blob/master/packages/object-is-empty/index.cjs
// returns false if obj is primitive value (even if 0)
export function isEmptyObjOrStr(obj: unknown) {
  if (obj == null) {
    return true;
  }

  if (Array.isArray(obj)) {
    return !obj.length;
  }

  if (typeof obj == 'string') {
    return !(obj as string).length;
  }

  const type = {}.toString.call(obj);

  if (type == '[object Object]') {
    return (
      !Object.keys(obj).length && !Object.getOwnPropertySymbols(obj).length
    );
  }

  if (type == '[object Map]' || type == '[object Set]') {
    return !(obj as Set<unknown> | Map<unknown, unknown>).size;
  }

  // other primitive || unidentifed object type (return false if non-empty obj or primitive)
  return !(Object(obj) !== obj || !Object.keys(obj).length); // => false if a primitive value or an unidentified object with at least 1 key

  // Object(obj) !== obj // => true if obj is a primitive | Object(obj) will produce an object with the same reference to obj if obj is an object type

  // Object.keys(obj).length === 0 // => true if obj has no keys (primitive values yields 0 keys, empty array yields 0 keys)

  // -OR -

  // return Object(obj) === obj && Object.keys(obj).length > 0; // => true if not a primitive type && an unidentifed object type with > 0 keys
}

// returns the orig value if it is a primitive (except string)
export function nullIfEmptyObjOrStr(arg: unknown) {
  return isEmptyObjOrStr(arg) ? null : arg; // isEmptyObjOrStr returns false if it is a primitive value
}

export const capitalizeFirstChar = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export const padLeftWithOneZero = (str: string) => {
  return str.length === 0 ? '' : str.length === 1 ? '0' + str : str;
};

export const padLeftWithTwoZeroes = (str: string) => {
  return str.length === 0
    ? ''
    : str.length === 1
      ? '00' + str
      : str.length === 2
        ? '0' + str
        : str;
};

// converts query results array that contain bigint type values to string
export const queryDataWithBigintToStr = (
  data: Array<{ [key: string]: unknown }>,
  keys?: string | Array<string>, // specify key that is a bigint for faster loop exec
) => {
  if (typeof keys === 'string') {
    return data.map((i) => {
      if (typeof i[keys] === 'bigint') i[keys] = i[keys].toString();
      return i;
    });
  }

  if (Array.isArray(keys)) {
    return data.map((i) => {
      keys.forEach((k) => {
        if (k in i && typeof i[k] === 'bigint') i[k] = i[k].toString();
      });
      return i;
    });
  }

  return data.map((i) => {
    for (const k in i) {
      if (typeof i[k] === 'bigint') i[k] = i[k].toString();
    }
    return i;
  });
};
