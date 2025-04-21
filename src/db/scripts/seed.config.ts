import '@/envConfig';
import getEnvValue from '@/utils/get-env-value';

const seedConfig = (function createConfig() {
  return {
    USER_NAME: getEnvValue('USER_NAME'),
    USER_EMAIL: getEnvValue('USER_EMAIL'),
    USER_IMAGE: getEnvValue('USER_IMAGE'),
    ACCOUNT_PROVIDER_ID: getEnvValue('ACCOUNT_PROVIDER_ID'),
    USER_NAME2: getEnvValue('USER_NAME2'),
    USER_EMAIL2: getEnvValue('USER_EMAIL2'),
  };
})();

export default seedConfig;
