import { defineConfig } from 'drizzle-kit';
import type { Config as DrizzleConfig } from 'drizzle-kit';
import '@/envConfig';

import { config } from '@/config/app.config';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './src/db/drizzle',
  dbCredentials: {
    url: config.DATABASE_URL,
  },
} satisfies DrizzleConfig);
