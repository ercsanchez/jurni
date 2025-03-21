import { httpRes } from '@/utils';

import handler from '@/middleware/handler';
import authCheck from '@/middleware/authCheck';
import { serverResponseError } from '@/utils';

export const GET = handler(authCheck, testGetEndpoint);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function testGetEndpoint(_req: Request) {
  try {
    return httpRes.ok({
      message: 'Successfully accessed protected API endpoint',
    });
  } catch (error: unknown) {
    return serverResponseError(error);
  }
}

// -----------------------------------------------------------------

// import { getSession } from '@auth/express';

// import authConfig from '@/config/nextauth.config';
// import { auth } from '@/lib/nextauth';

// export const GET = auth(async function GET(req: Request) {
//   console.log('/test GET');

//   console.log('req.auth', req.auth);

//   // DOESN'T WORK
//   const session = await getSession(req, authConfig);
//   console.log('getSession', session);

//   return httpRes.ok({ message: 'test route' });
// });
