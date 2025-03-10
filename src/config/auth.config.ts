import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

import { config } from '@/config/app.config';

export default {
  secret: config.AUTH_SECRET,
  providers: [
    Google({
      clientId: config.AUTH_GOOGLE_ID,
      clientSecret: config.AUTH_GOOGLE_SECRET,
    }),
  ],
} satisfies NextAuthConfig;
