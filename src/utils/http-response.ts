import { NextResponse } from 'next/server';

interface HttpResConfig {
  [key: string]: { status: number; success?: string; error?: string };
}

const httpResConfig: HttpResConfig = {
  ok: { status: 200, success: 'OK' },
  created: { status: 201, success: 'Created' },
  accepted: { status: 202, success: 'Accepted' },
  noContent: { status: 204, success: 'No Content' },
  badRequest: { status: 400, error: 'Bad Request' },
  unauthorized: { status: 401, error: 'Unauthorized' },
  forbidden: { status: 403, error: 'Forbidden' },
  notFound: { status: 404, error: 'Not Found' },
  internalServerErr: { status: 500, error: 'Internal Server Error' },
  serviceUnavailable: { status: 503, error: 'Service Unavailable' },
};

interface SuccessData {
  data: unknown;
  message?: string;
}

interface ErrorData {
  message?: string;
}

interface HttpRes {
  [key: string]: (
    payload?: SuccessData | ErrorData,
  ) => NextResponse<SuccessData | ErrorData>;
  // ) => NextResponse<SuccessResponse | ErrorResponse>;
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

export default httpRes;

//  NOT NEEDED
// interface SuccessResponse {
//   // success: string;
//   // not needed since already provided by the config | only passed args need to be specified in the type

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
