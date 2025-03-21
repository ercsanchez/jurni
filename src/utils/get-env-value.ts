export default function getEnvValue(
  key: string,
  defaultValue: string = '',
): string {
  const value = process.env[key];

  if (!value) {
    // abovecondition is equivalent to value?.length === 0 || value === undefined

    if (defaultValue) {
      return defaultValue;
    }
    throw new Error(`Enviroment variable ${key} is not set`);
  }
  return value;
}
