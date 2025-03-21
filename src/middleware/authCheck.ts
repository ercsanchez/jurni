import { currentAuthUser } from '@/lib/nextauth';
import { NextFunction } from '@/middleware/handler';
import { httpRes } from '@/utils';

export default async function authCheck(req: Request, next: NextFunction) {
  const urlPath = URL.parse(req.url)?.pathname;
  console.log(`middleware auth check: ${urlPath}`);

  const sessionUser = await currentAuthUser();

  console.log('session user check', Boolean(sessionUser));
  if (!sessionUser)
    return httpRes.unauthenticated({ message: 'User is not authenticated.' });

  next();
}

// add user role checking

// add group role checking
