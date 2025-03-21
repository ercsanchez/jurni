import { drizzle } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePool } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';

// FOR DRIZZLE QUERY TRANSACTIONS -------------------
import { Pool } from '@neondatabase/serverless'; // not needed
import * as schema from '@/db/schema';
//---------------------------------------------------

import appConfig from '@/config/app.config';

// db connection w/o using neon db serverless
// export const db = drizzle(process.env.DATABASE_URL!);
// export const db = drizzle(appConfig.DATABASE_URL!);

// drizzle synchronous connection: https://orm.drizzle.team/docs/get-started/neon-new#step-3---connect-drizzle-orm-to-the-database
// const sql = neon(appConfig.DATABASE_URL!);
// export const db = drizzle({ client: sql });

// if passing the drizzle schema
// const sql = neon(process.env.DATABASE_URL!);
const sql = neon(appConfig.DATABASE_URL!);
export const db = drizzle({ client: sql, schema: schema });

// - OR -
// https://neon.tech/docs/guides/drizzle-migrations#seed-the-database
// const sql = neon(appConfig.DATABASE_URL!);
// export const db = drizzle(sql);

// FOR DRIZZLE QUERY TRANSACTIONS ---------------------------------------------
// this works
// export const dbPool = drizzlePool(appConfig.DATABASE_URL!);

// this works
export const pool = new Pool({ connectionString: appConfig.DATABASE_URL });
export const dbPool = drizzlePool(pool, { schema });

// this works
// export const dbPool = drizzlePool(pool);

// this works
// export const dbPool = drizzlePool({ client: pool });

// this doesn't work
// export const dbPool = drizzle({ client: pool });

// this doesn't work
// export const dbPool = drizzle(appConfig.DATABASE_URL!).$client;
