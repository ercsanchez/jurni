// import path from 'path';

import appConfig from '@/config/app.config';
import { httpResByStatus, serverResponseError } from '@/utils';
import { NextResponse } from 'next/server';

// NO NEED FOR AUTH CHECK -------------------------------------
// import handler from '@/middleware/handler';
// import authCheck from '@/middleware/authCheck';
// export const GET = handler(authCheck, getCSRF);
// async function getCSRF(req: Request) {
// ------------------------------------------------------------

export async function GET(req: Request) {
  // console.log('api/csrf====>');

  const url = appConfig.APP_URL + '/api/auth/csrf';
  // const reqHeaders = Object.fromEntries(req.headers);
  // - OR -
  const reqHeaders = new Headers(req.headers);
  console.log('reqHeaders', reqHeaders);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: reqHeaders, // need to retrieve headers from the original req and pass those for the auth cookie, otherwise, response from api/auth/csrf is "Error: Unauthenticated"
    });
    console.log('response api/auth/csrf====>', response);

    if (!response.ok) {
      return httpResByStatus(response.status, response.statusText);
    }

    const data = await response.json();

    // returning response from api/auth/csrf will cause an error when using postman to test route using the deployment (with domain already set)
    // return response;

    console.log(
      'response api/csrf ====>',
      NextResponse.json(
        {
          message: 'csrfToken retrieved',
          data,
        },
        {
          status: 200,
          statusText: 'OK',
          headers: new Headers(response.headers),
        },
      ),
    );

    const resHeaders = response.headers;
    console.log('response.headers', resHeaders);
    // console.log(
    //   'individual res headers',
    //   resHeaders.getSetCookie(),
    //   resHeaders.get('set-cookie'),
    //   resHeaders.get('date'),
    //   resHeaders.get('connection'),
    //   resHeaders.get('keep-alive'),
    //   resHeaders.get('transfer-encoding'),
    //   resHeaders.get('vary'),
    // );

    let responseInitOpts;
    if (resHeaders.get('set-cookie')) {
      responseInitOpts = {
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'set-cookie': resHeaders.get('set-cookie')!,
          date: resHeaders.get('date')!,
          connection: resHeaders.get('connection')!,
          'keep-alive': resHeaders.get('keep-alive')!,
          'transfer-encoding': resHeaders.get('transfer-encoding')!,
          vary: resHeaders.get('vary')!,
        }),
      };
    } else {
      responseInitOpts = {
        status: 200,
        statusText: 'OK',
      };
    }

    console.log(
      'NextResponse====>',
      NextResponse.json(
        {
          message: 'csrfToken retrieved',
          data,
        },
        { ...responseInitOpts },
      ),
    );
    return NextResponse.json(
      {
        message: 'csrfToken retrieved',
        data,
      },
      { ...responseInitOpts },
    );
  } catch (error: unknown) {
    return serverResponseError(error);
  }
}
