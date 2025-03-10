import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';

import authConfig from '@/config/auth.config';
import { db } from '@/db';
import { updateUserEmailVerified } from '@/queries/update';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: 'jwt' },

  events: {
    // linkAccount executes when an oauth account is linked to a user
    // its assumed that the oauth provider is reliable and already takes care of verifying user's email
    // credentials provider needs a separate process to verify user's email, since it doesn't fire linkAccount event on registration
    async linkAccount({ user }) {
      // console.log(`linkAccount user: ${JSON.stringify(user)}`);
      await updateUserEmailVerified(user.id!);
    },
  },

  ...authConfig,
});
