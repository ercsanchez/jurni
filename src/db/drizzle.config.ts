import { defineConfig } from 'drizzle-kit';
import type { Config as DrizzleConfig } from 'drizzle-kit';

import appConfig from '@/config/app.config';

export default defineConfig({
  dialect: 'postgresql',
  // schema: './src/db/betterauth-schema.ts',
  schema: './src/db/schema.ts',
  out: './src/db/drizzle',
  dbCredentials: {
    url: appConfig.DATABASE_URL,
  },
} satisfies DrizzleConfig);
