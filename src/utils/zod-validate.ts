import * as z from 'zod';

export function zodValidate(zodSchema: z.Schema, data: object) {
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

interface SearchParamsZodSchemas {
  [key: string]: z.ZodType;
}

interface SearchParamsData {
  [key: string]: string;
}

interface SearchParamsZodValidationResult {
  [key: string]: {
    success: boolean;
    message?: string;
    data?: { [key: string]: string };
  };
}

export function zodValidatesearchParams(
  schemas: SearchParamsZodSchemas,
  searchParamsObj: SearchParamsData,
): SearchParamsZodValidationResult {
  const result: SearchParamsZodValidationResult = {};

  for (const key in schemas) {
    const validation = zodValidate(schemas[key], searchParamsObj);
    const { success, message, data: validatedData } = validation;
    result[key] = { success, message, data: validatedData };
  }

  return result;
}
