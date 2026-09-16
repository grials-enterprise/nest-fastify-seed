import { PipeTransform } from '@nestjs/common';
import { validators } from '../ajv/ajv.js';

export const AjvValidationPipe = (schemaId: string): PipeTransform => ({
  transform(value: any) {
    validators.validateData(schemaId, value);
    return value;
  },
});
