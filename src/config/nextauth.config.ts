import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

import { SelectAccount } from '@/db/schema';

import appConfig from '@/config/app.config';
import { LoginSchema } from '@/zod-schemas';
import { selectUserWithSpecificAccountByEmail } from '@/db-access/select';
import { comparePassword, zodValidate } from '@/utils';

export default {
  secret: appConfig.AUTH_SECRET,
  providers: [
    Google({
      clientId: appConfig.AUTH_GOOGLE_ID,
      clientSecret: appConfig.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
      // if allowDangerousEmailAccountLinking=true for a specific provider, oauth acct will be linked to user with the same email, however, user's email can be changed in the db and it will no longer match
    }),
    Credentials({
      credentials: {
        email: { label: 'Email' },
        password: { label: 'Password', type: 'password' },
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async authorize(credentials, _req) {
        // callback authorize only fires when user clicks the "Sign in with Credentials" btn on default next-auth page (/api/auth/signin)

        // console.log("_req", _req);
        console.log('credentials callback authorize --------------');

        const validation = zodValidate(LoginSchema, {
          email: credentials.email,
          password: credentials.password,
        });
        // console.log('validation.data', validation);

        if (validation.success) {
          const { email, password } = validation.data;

          // use a select transaction (user and account)
          // const existingUser = await selectUserByEmail(email);

          // by default next-auth doesn't expect user to have an account when signing in via credentials

          const existingUser = await selectUserWithSpecificAccountByEmail(
            email,
            'credentials',
          );
          const [existingAccount] =
            existingUser?.accounts as Array<SelectAccount>;

          // console.log('existingUser', existingUser);
          // console.log('existingAccount======>', existingAccount);

          // user has no password if using other providers like Github/Google
          if (
            !existingUser ||
            // !existingUser.emailVerified ||
            !existingUser.password ||
            !existingAccount // only check if we create an account record when user registers via credentials
          ) {
            return null;
          }

          // don't check email verified here
          // if (!existingUser.emailVerified) {
          //   console.log('email not verified');
          //   // // throw new Error('Email has not yet been verified'); // produces Error in server, CallbackRouteError (because res is not returned and we throw error)
          //   return httpRes.badRequest({
          //     message: 'Email has not yet been verified',
          //   }); // cannot use this since we cannot return response here
          // }

          const passwordsMatch = await comparePassword(
            password,
            existingUser.password,
          );

          // console.log('passwordsMatch', passwordsMatch);

          if (passwordsMatch) return existingUser;

          // by default, next-auth only creates an account record when a user signs in with oauth and user's pword is not set
          // retrieve account record linked to user and also pass the account w/ provider=credentials

          // console.log('user authorized', JSON.stringify(existingUser));
        }

        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;
