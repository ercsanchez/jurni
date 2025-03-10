import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';

import authConfig from '@/config/auth.config';
import { db } from '@/db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: 'jwt' },
  ...authConfig,
});
