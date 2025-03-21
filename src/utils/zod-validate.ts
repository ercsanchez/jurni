import * as z from 'zod';

// export default function zodValidate(zodSchema: z.Schema, data: {}) {
export default function zodValidate(zodSchema: z.Schema, data: object) {
  const validation = zodSchema.safeParse(data);
  // console.log('zod validation result:', JSON.stringify(validation));

  const { success, data: zodValidatedData } = validation;

  if (!success) {
    return {
      success,
      message: validation.error?.issues.map((e) => e.message)[0],
    };
  }

  return { success, data: zodValidatedData };
}
