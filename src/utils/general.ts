export function nullIfEmptyArrOrStr(array: Array<unknown> | string) {
  return array.length > 0 ? array : null;
}

export const capitalizeFirstChar = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);
