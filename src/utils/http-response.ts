import { DrizzleError } from 'drizzle-orm';
import { NextResponse } from 'next/server';

const httpResConfig: {
  [key: string]: {
    status: number;
    statusText: string;
  };
} = {
  ok: { status: 200, statusText: 'OK' },
  created: { status: 201, statusText: 'Created' },

  // request has been received but not yet acted upon
  accepted: { status: 202, statusText: 'Accepted' },

  // response body must be empty for 204, so this is not applicable since we always return a { data: {}, success: "" }
  // noContent: { status: 204, , statusText: 'No Content' },

  // response body must be empty for 204, so this is not applicable since we always return a { data: {}, success: "" }
  found: { status: 302, statusText: 'Found' },

  badRequest: { status: 400, statusText: 'Bad Request' },

  // user is unauthenticated
  unauthenticated: { status: 401, statusText: 'Unauthenticated' },

  // user is authenticated but is not allowed to access resource
  forbidden: { status: 403, statusText: 'Forbidden' },

  notFound: { status: 404, statusText: 'Not Found' },
  conflict: { status: 409, statusText: 'Conflict' },
  internalServerErr: { status: 500, statusText: 'Internal Server Error' },
  serviceUnavailable: { status: 503, statusText: 'Service Unavailable' },

  // additional authentication in server to access another server/service
  networkAuthRequired: {
    status: 511,
    statusText: 'Network Authentication Required',
  },
};

interface SuccessData {
  data: object | string;
  message?: string;
  headers?: Headers;
}

interface ErrorData {
  message?: string;
  headers?: Headers;
}

type HttpResFn = (
  payload?: SuccessData | ErrorData,
) => NextResponse<SuccessData | ErrorData>;
// only passed args need to be specified in the NextResponse generic type

const httpRes: {
  // ok: HttpResFn; // no need to define each key
  [key: string]: HttpResFn;
} = {
  // ok: () => NextResponse.json({}, {}), // no need to define the keys
};

for (const key in httpResConfig) {
  httpRes[key] = (payload?: SuccessData | ErrorData) => {
    const httpResConfigValues = httpResConfig[key];
    const { status, statusText } = httpResConfigValues;

    return httpResByStatus({ status, statusText, ...payload });
  };
}

function httpResByStatus({
  status,
  statusText = '',
  message,
  data,
  headers,
}: {
  status: number;
  statusText?: string;
  message?: string;
  data?: object | string;
  headers?: Headers;
}) {
  // }): NextResponse<SuccessData | ErrorData> { // no need to specify return type
  const responseArray = Object.entries(httpResConfig);

  // filter out the matching httpResConfigKey by comparing the status
  const [httpResConfigKey] = responseArray
    .filter((i) => status === i[1].status)
    .map((i) => i[0]);

  let statusTextVal;
  if (statusText.length > 0) {
    statusTextVal = statusText;
  } else if (httpResConfigKey) {
    statusTextVal = httpResConfig[httpResConfigKey]['statusText'];
  }

  // NextResponse will assign '' empty string to statusText by default

  return NextResponse.json(
    { data, message },
    { status, statusText: statusTextVal, headers },
  );
}

// still needed, even though, we have httpResByStatus, since catched errors don't have a status code
function serverResponseError(error: unknown, options?: { message: string }) {
  console.error(error); // log where error occured in the route (if not already catched by the fn)

  const optionsMsg = options?.message;

  if (optionsMsg) console.log(optionsMsg); // log the supplied server response error message

  const { message: errorMsg, name: errorName } = error as Error;

  // console.error(new Error(`[${errorName}]: ${errorMsg}`)); // don't use this since we won't be able to trace where the error occurred

  const errorMsgWithName = `Error [${errorName}]: ${errorMsg}`;

  // any error that extends Error will be an instanceof it
  // possible error types: TypeError, NeonDbError, DrizzleError
  // throw new Error('Something went wrong on the server side.');
  // better to send a response since we can send additional info in response body

  // this is just in case Rollback Transaction Error is not caught in the transaction query (no try-catch block inside of fn)
  if (error instanceof DrizzleError && errorMsg.includes('Rollback')) {
    return httpRes.internalServerErr({
      message: optionsMsg ?? `${errorMsgWithName} (Transaction failed)`,
    });
  }

  const responseMsg = optionsMsg ?? errorMsgWithName;

  // no need to handle if an error instance, since this fn will only be used in a catch block where an error object is always received

  return httpRes.internalServerErr({
    message: responseMsg ?? 'Unknown Server Error',
  });

  // console.error(JSON.stringify(error, ['name', 'message', 'stack']));
  // console.log(error.name, error.message, error.stack, error.cause);
}

export { httpResConfig, httpRes, httpResByStatus, serverResponseError };
