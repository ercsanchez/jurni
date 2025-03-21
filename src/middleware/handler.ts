// CUSTOM MIDDLEWARE
// article: https://medium.com/sopra-steria-norge/how-to-write-actual-api-middleware-for-next-js-2a38355f6674
// GitHub source: https://github.com/undrash/next.js-api-middleware/blob/main/demo-route-handlers/src/app/middleware/handler.ts

import { NextRequest, NextResponse } from 'next/server';

export type NextFunction = () => void;

export type Middleware = (
  request: NextRequest | Request,
  // response: NextResponse,
  next: NextFunction,
) => Promise<NextResponse | void>;

const handler =
  (...middleware: Middleware[]) =>
  // async (request: NextRequest | Request, response: NextResponse) => {
  async (request: NextRequest | Request) => {
    let result;

    for (let i = 0; i < middleware.length; i++) {
      let nextInvoked = false;

      const next = async () => {
        nextInvoked = true;
      };

      // result = await middleware[i](request, response, next);
      result = await middleware[i](request, next);

      if (!nextInvoked) {
        break;
      }
    }

    if (result) return result;

    throw new Error('Your handler or middleware must return a NextResponse!');
  };

export default handler;
