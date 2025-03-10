import getEnvValue from '@/utils/get-env-value';

const appConfig = () => ({
  DATABASE_URL: getEnvValue('DATABASE_URL'),
  AUTH_SECRET: getEnvValue('AUTH_SECRET'),
  AUTH_GOOGLE_ID: getEnvValue('AUTH_GOOGLE_ID'),
  AUTH_GOOGLE_SECRET: getEnvValue('AUTH_GOOGLE_SECRET'),
});

export const config = appConfig();
