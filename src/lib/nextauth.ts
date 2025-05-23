import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';

import { db } from '@/db';
import { accounts, users } from '@/db/schema';
import { selUserById, selUserByName } from '@/db-access/select';
import { upUser } from '@/db-access/update';
import authConfig from '@/lib/nextauth.config';
import { createUniqSlugWithSelQryBySlug } from '@/utils';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
  }),
  session: { strategy: 'jwt' },
  basePath: '/api/auth', // default: /api/auth

  events: {
    // linkAccount executes when an oauth account is linked to a user
    // its assumed that the oauth provider is reliable and already takes care of verifying user's email
    // credentials provider needs a separate process to verify user's email, since it doesn't fire linkAccount event on registration
    async linkAccount({ user }) {
      console.log(`linkAccount user: ${JSON.stringify(user)}`);

      // if user doesn't have a name from the oauth provider, then create a slug based on oauth email username
      let createdNameSlug;
      if (!user.name) {
        const [emailUsername] = user.email!.split('@');
        createdNameSlug = await createUniqSlugWithSelQryBySlug({
          str: emailUsername,
          fn: selUserByName,
        });
      }
      const name = user.name ? undefined : createdNameSlug;

      await upUser({ userId: user.id!, verifyEmail: true, name });
    },
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 30, // 60secs * 60mins * 24hrs * 30days
    // encode: async ({
    //   token: JWT,
    //   secret: string,
    //   maxAge: number,
    // }): Promise<string> => {
    //   return '';
    // },
  },
  callbacks: {
    // async redirect({ url, baseUrl }) {
    //   console.log('callback redirecting -------------------');

    //   // FROM NEXT AUTH DOCS
    //   // // Allows relative callback URLs
    //   // if (url.startsWith('/')) return `${baseUrl}${url}`;
    //   // // Allows callback URLs on the same origin
    //   // else if (new URL(url).origin === baseUrl) return url;
    //   // return baseUrl;

    //   // return '/';

    //   return '';
    // },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async signIn({ user, account, profile, email }) {
      // additional controls if user is allowed to sign in after performing provider authorize (e.g. credentials authorize fn)
      console.log('callback signIn --------------');
      // console.log('user:', JSON.stringify(user)); // from db
      // console.log('account:', JSON.stringify(account)); // from db
      // console.log('profile:', JSON.stringify(profile)); // from oauth provider
      // console.log('email:', JSON.stringify(email)); // returns undefined

      if (account?.provider === 'credentials') {
        // only execute the following if signing in thru credentials
        // you can also use selUserById(user.id!)
        // const existingUser = await selUserByEmail(user.email!);
        // if credentials provider and email not verified then refuse sign in
        // if (!existingUser?.emailVerified) return false;
        // if (!user?.emailVerified) return false; // will cause a typescript error since next-auth user has a User | AdapterUser type (w/c doesn't have emailVerified)
      }

      if (account?.provider === 'google' && profile?.email !== user.email) {
        // if allowDangerousEmailAccountLinking=true for a specific provider, ensure that user's email = oauth email

        console.error(
          new Error(`${account?.provider} email doesn't match user's email.`),
        );
        return false;
      }

      return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async jwt({ token, user, account, profile, trigger }) {
      // called when a jwt is created or when a session is accessed in the client
      console.log('callback jwt --------------');
      // console.log(`initial token: ${JSON.stringify(token)}`);
      // console.log(`user: ${JSON.stringify(user)}`);
      // console.log(`account: ${JSON.stringify(account)}`); // oauth acct details (incl. oauth access token)
      // console.log(`profile: ${JSON.stringify(profile)}`);
      // console.log(`trigger: ${JSON.stringify(trigger)}`); // fn that triggered jwt callback;

      // token.sub is the user.id
      if (!token.sub) {
        console.log('!token.sub', !token.sub);
        return token;
      }

      const existingUser = await selUserById(token.sub);

      if (!existingUser) {
        // console.log('!existingUser', existingUser);
        return token;
      }

      // console.log(`existingUser: ${JSON.stringify(existingUser)}`);

      // model fields that can be updated by the user in the settings page
      // token.name = existingUser.name;
      // token.email = existingUser.email;

      // attach additional user db fields to token | only name, email, picture are added to token by default
      // token.role = existingUser.role;

      // no need to attach provider to token, at this time
      // const existingAccount = await selAccountByUserIdWhereProvider(
      //   existingUser.id,
      //   'credentials',
      // );
      // token.provider = existingAccount?.provider;
      // // - OR -
      // token.provider = account?.provider;

      // if need to retrieve account for checking if either credentials or oauth
      // const existingAccount = await selectAccountByUserId(existingUser.id);
      // type coercion to boolean
      // token.isOAuth = !!existingAccount; // true if an oauth acct is linked to user

      // console.log(`final token: ${JSON.stringify(token)}`);
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async session({ token, session, user }) {
      // called whenever a session is checked (only a subset of the token is returned)
      console.log('callback session --------------');

      // attach user's id (stored in token), to session
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      // console.log(`session: ${JSON.stringify(session)}`);
      // console.log(`token: ${JSON.stringify(token)}`);

      // user only available when AuthConfig.session is set to strategy: "database"
      // console.log(`user: ${JSON.stringify(user)}`);

      return session;
    },
  },
  // -------------------------------------------------------------
  ...authConfig,
});

export const currentAuthUser = async () => {
  const session = await auth();

  // console.log('currentSession', session);
  // console.log('currentAuthUser', session?.user);

  return session?.user;
};
