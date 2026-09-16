import { startSchemasValidators } from '@grials/shared-tools';
import { defaultSchema } from './schemas/default.schema.js';
import { headersValidationSchema } from './schemas/headers.schema.js';

export const validators = startSchemasValidators([
  defaultSchema,
  headersValidationSchema,
]);
