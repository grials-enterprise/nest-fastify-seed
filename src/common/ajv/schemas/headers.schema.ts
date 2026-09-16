export const headersValidationSchema = {
  $id: 'headersValidationData',
  type: 'object',
  required: ['l-api-version'],
  properties: {
    'l-api-version': { type: 'string' },
  },
};
