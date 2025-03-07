import getEnvValue from '@/utils/get-env-value';

const appConfig = () => ({
  DATABASE_URL: getEnvValue('DATABASE_URL'),
});

export const config = appConfig();
