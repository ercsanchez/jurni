export function nullIfEmptyArrOrStr(array: Array<unknown> | string) {
  return array.length > 0 ? array : null;
}
