import { NextResponse } from 'next/server';

interface HttpResConfig {
  [key: string]: { status: number; success?: string; error?: string };
}

const httpResConfig: HttpResConfig = {
  ok: { status: 200, success: 'OK' },
  created: { status: 201, success: 'Created' }, // request has been received but not yet acted upon
  accepted: { status: 202, success: 'Accepted' },
  // noContent: { status: 204, success: 'No Content' }, // response body must be empty for 204, so this is not applicable since we always return a { data: {}, success: "" }
  found: { status: 302, error: 'Found' }, // request to URI is successful then redirect
  badRequest: { status: 400, error: 'Bad Request' },
  unauthenticated: { status: 401, error: 'Unauthenticated' }, // user is authenticated
  forbidden: { status: 403, error: 'Forbidden' }, // user is authenticated but is not allowed to access resource
  notFound: { status: 404, error: 'Not Found' },
  conflict: { status: 409, error: 'Conflict' },
  internalServerErr: { status: 500, error: 'Internal Server Error' },
  serviceUnavailable: { status: 503, error: 'Service Unavailable' },
  // networkAuthRequired: {
  //   status: 511,
  //   error: 'Network Authentication Required',
  // }, // additional authentication in server to access another server/service
};

interface SuccessData {
  data: unknown;
  message?: string;
  success?: string;
}

interface ErrorData {
  message?: string;
  error?: string;
}

interface HttpRes {
  [key: string]: (
    payload?: SuccessData | ErrorData,
  ) => NextResponse<SuccessData | ErrorData>;
  // ) => NextResponse<SuccessResponse | ErrorResponse>; // only passed args need to be specified in the NextResponse generic type
}

const httpRes: HttpRes = {};

for (const key in httpResConfig) {
  httpRes[key] = (payload = {}) => {
    const httpResConfigValues = httpResConfig[key];
    const { status, ...rest } = httpResConfigValues;

    return NextResponse.json(
      {
        ...payload,
        ...rest,
      },
      { status },
    );
  };
}

type HttpResByStatus = (
  status: number,
  statusText?: string,
) => NextResponse<SuccessData | ErrorData>;

const httpResByStatus: HttpResByStatus = (status, statusText = '') => {
  const responseArray = Object.entries(httpResConfig);

  // filter out the matching httpResConfigKey by comparing the status
  const result = responseArray
    .filter((i) => status === i[1].status)
    .map((i) => i[0]);
  const matchingHttpResConfigKeyFound = result.length === 1;

  // console.log('result====>', result);

  // console.log(
  //   'matchingHttpResConfigKeyFound====>',
  //   matchingHttpResConfigKeyFound,
  // );
  if (!matchingHttpResConfigKeyFound) {
    // if the status argument is not defined in the httpResConfig, create a custom response
    const payload =
      200 <= status && status < 300
        ? { success: statusText }
        : { error: statusText };

    return NextResponse.json(
      {
        ...payload,
      },
      { status },
    );
  }

  // if the status argument is defined in the httpResConfig
  const [httpResConfigKey] = result;

  // console.log('httpResConfigKey====>', httpResConfigKey);

  return httpRes[httpResConfigKey]();
};

// still needed, even though, we have httpResByStatus, since catched errors don't have a status code
function serverResponseError(error: unknown) {
  // console.error(
  //   JSON.stringify(error, ['name', 'message', 'stack']),
  // );

  console.error(error);

  // any error that extends Error (e.g. TypeError, NeonDbError) will also be true)
  // need this conditional, otherwise typescript error for error.message since error params type is unknown
  if (error instanceof Error) {
    // console.log(
    //   '[ERROR]:',
    //   '\nName: ',
    //   error.name,
    //   '\nMessage: ',
    //   error.message,
    //   '\nStack: ',
    //   error.stack,
    //   '\nCause: ',
    //   error.cause,
    // );

    // console.log('error check', error instanceof TypeError);

    return httpRes.internalServerErr({
      // message: `${error.name}: ${error.message}`, // don't show error.name in response body
      // SHOULD WE REALLY BE PASSING MESSAGES TO THE USER?
      // TODO: MAYBE JUST USE error.message ? 'Something went wrong in the server.' : 'Unknown Server Error'
      message: error.message ?? 'Unknown Server Error',
    });
  }

  //  no need for this since error object will always be an Error type
  // return httpRes.internalServerErr({
  //   message: 'Unknown Server Error',
  // });
}

export { httpResConfig, httpRes, httpResByStatus, serverResponseError };

// NOT NEEDED
// interface SuccessResponse {
//   // success: string; // since already provided by the config | only passed args need to be specified in the type

//   data: unknown;
//   message?: string;
// }

// interface ErrorResponse {
//   // error: string;
//   message?: string;
// }

// interface HttpRes {
//   [key: string]: (
//     payload: SuccessData | ErrorData,
//   ) => NextResponse<SuccessResponse | ErrorResponse>;
// }
