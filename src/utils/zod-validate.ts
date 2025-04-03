import * as z from 'zod';

import {
  type SearchParamsSchemas,
  type UrlSearchParams,
  type ValidationResult,
} from './defs';
import { capitalizeFirstChar } from './general';

export function zodValidate(zodSchema: z.Schema, data: object) {
  // best to let function infer the return type
  // ): ValidationResult {
  const validation = zodSchema.safeParse(data);
  // console.log('zod validation result:', JSON.stringify(validation));

  const { success, data: zodValidatedData } = validation;
  // zodValidatedData => undefined if validation failed

  if (!success) {
    const zodErrorMsg = validation.error?.issues.map((e) => e.message)[0];
    console.error(new Error(`Zod Validation Error: ${zodErrorMsg}`));
    return {
      success,
      message: zodErrorMsg,
    };
  }

  return { success, data: zodValidatedData };
}

export function zodValidateSearchParams(
  schemas: SearchParamsSchemas,
  searchParams: UrlSearchParams,
) {
  // best to let function infer the return type
  // ): ValidationResult {
  const validationResults: ValidationResult[] = [];

  for (const key in schemas) {
    const validation = zodValidate(schemas[key], searchParams);
    // const { success, message, data: validatedData } = validation;

    // validationResults.push({
    //   success,
    //   message,
    //   data: validatedData, // => undefined if zodValidate failed
    //   schemaKey: key,
    // });
    validationResults.push({ ...validation, schemaKey: key });
  }

  const [successfulValidation] = validationResults.filter((i) => i.success);

  // only console.error once for-in loop finishes and if all schemas failed validation
  if (!successfulValidation) {
    // all of the SearchParamsSchemas failed zod validation

    validationResults.map((i) =>
      console.error(
        new Error(`${capitalizeFirstChar(i.schemaKey!)}: ${i.message}`, {
          cause: `Zod Validation Error: ${capitalizeFirstChar(i.schemaKey!)}`,
        }),
      ),
    );

    return {
      success: false,
      message: 'Invalid URL query params.',
    };
  }

  return successfulValidation;
}
