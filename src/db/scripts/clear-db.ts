import { sql } from 'drizzle-orm';

import { db } from '@/db';

const clearDb = async (): Promise<void> => {
  await db.execute(sql`
    do $$ declare
      r record;
    begin
      for r in (select tablename from pg_tables where schemaname = current_schema()) loop
        execute 'drop table if exists ' || quote_ident(r.tablename) || ' cascade';
      end loop;
    end $$;
  `);
};

clearDb();
