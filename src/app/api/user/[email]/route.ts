// EXAMPLE ROUTE
import { httpRes } from '@/utils';
import { serverResponseError } from '@/utils';
import { queryFindUserByEmailWithAccts } from '@/db-access/query';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ email: string }> },
) {
  try {
    const { email } = await params;

    // const result = await selectUserByEmail(email);

    const result = await queryFindUserByEmailWithAccts(email);
    // console.log('queryFindUserByEmailWithAccts', JSON.stringify(result));

    // add validation for email in query params here

    if (!result) return httpRes.notFound({ message: 'User not found.' });

    return httpRes.ok({
      message: 'User retrieved',
      data: result,
    });
  } catch (error: unknown) {
    return serverResponseError(error);
  }
}
