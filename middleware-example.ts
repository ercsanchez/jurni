// export { auth as middleware } from '@/lib/nextauth';

import NextAuth from 'next-auth';
import authConfig from '@/config/nextauth.config';

import { NextRequest } from 'next/server';

const { auth } = NextAuth(authConfig);

// export default NextAuth(authConfig);
export default auth(function (req: NextRequest) {
  // export default auth(async function middleware(req: NextRequest) {
  const urlPath = URL.parse(req.url)?.pathname;
  const { nextUrl } = req;

  console.log('in middleware', urlPath);
  if ('auth' in req) console.log('req.auth', req.auth);

  const isApiAuthRoute = nextUrl.pathname.startsWith('/api');

  if (isApiAuthRoute) {
    console.log('is api route, so stop middleware execution');
    return; // don't do anything
  }

  return;
});

export const config = {
  // test url path for middleware:
  // matcher: ["/auth/login", "/auth/register"], // test url path for middleware

  // auth.js docs:
  // matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"], // auth.js docs

  // clerk docs:
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'], // source: https://clerk.com/docs/quickstarts/nextjs?utm_source=sponsorship&utm_medium=youtube&utm_campaign=code-with-antonio&utm_content=12-31-2023#add-middleware-to-your-application
};
