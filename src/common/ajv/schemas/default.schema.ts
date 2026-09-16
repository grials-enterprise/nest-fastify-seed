export const defaultSchema = {
  $id: 'default',
  type: 'object',
  additionalProperties: false,
  required: ['text'],
  properties: {
    name: { type: 'string' },
    text: { type: 'string' },
    active: { type: 'boolean' },
  },
};
