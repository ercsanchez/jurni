import { drizzle } from 'drizzle-orm/neon-http';
// import { neon } from '@neondatabase/serverless';

import { config } from '@/config/app.config';
// import * as schema from '@/db/schema';

// db connection w/o using neon db serverless
export const db = drizzle(config.DATABASE_URL!);

// drizzle synchronous connection: https://orm.drizzle.team/docs/get-started/neon-new#step-3---connect-drizzle-orm-to-the-database
// const sql = neon(config.DATABASE_URL!);
// export const db = drizzle({ client: sql });

// if passing the drizzle schema
// const sql = neon(config.DATABASE_URL!);
// export const db = drizzle({ client: sql, schema: schema });

// - OR -
// https://neon.tech/docs/guides/drizzle-migrations#seed-the-database
// const sql = neon(config.DATABASE_URL!);
// export const db = drizzle(sql);
