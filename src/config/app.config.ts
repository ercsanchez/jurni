import getEnvValue from '@/utils/get-env-value';

const appConfig = (function createConfig() {
  return {
    APP_URL: getEnvValue('APP_URL'),
    AUTH_GOOGLE_ID: getEnvValue('AUTH_GOOGLE_ID'),
    AUTH_GOOGLE_SECRET: getEnvValue('AUTH_GOOGLE_SECRET'),
    AUTH_SECRET: getEnvValue('AUTH_SECRET'),
    // BETTER_AUTH_SECRET: getEnvValue('BETTER_AUTH_SECRET'),
    // BETTER_AUTH_URL: getEnvValue('BETTER_AUTH_URL'),
    DATABASE_URL: getEnvValue('DATABASE_URL'),
    PWORD_HASH_SALT_LENGTH: parseInt(getEnvValue('PWORD_HASH_SALT_LENGTH')),
  };
})();

// console.log('appConfig', appConfig);

export default appConfig;
