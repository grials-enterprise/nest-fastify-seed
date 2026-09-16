import * as assert from 'assert';
import { Test } from '@nestjs/testing';
import { DefaultsService } from '../../src/defaults/defaults.service.js';
import { DefaultsDaos } from '../../src/defaults/defaults.daos.js';

describe('DefaultsService', () => {
  let service: DefaultsService;

  const daoMock = {
    paginateDefault: async (query: any) => ({ query, page: 1 }),
    listDefault: async () => [{ name: 'x' }],
    getDefaultById: async (id: string) => ({ _id: id }),
    createDefault: async (data: any) => data,
    updateDefault: async (id: string, data: any) => ({ _id: id, ...data }),
    activateDefault: async (id: string) => ({ _id: id, active: true }),
    deactivateDefault: async (id: string) => ({ _id: id, active: false }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DefaultsService,
        { provide: DefaultsDaos, useValue: daoMock },
      ],
    }).compile();

    service = moduleRef.get(DefaultsService);
  });

  it('paginateDefault delegates to the DAO', async () => {
    const result = await service.paginateDefault({ skip: 2 });
    assert.deepStrictEqual(result, { query: { skip: 2 }, page: 1 });
  });

  it('listDefault delegates to the DAO', async () => {
    const result = await service.listDefault({});
    assert.deepStrictEqual(result, [{ name: 'x' }]);
  });

  it('getDefaultById delegates to the DAO', async () => {
    const result = await service.getDefaultById('abc');
    assert.deepStrictEqual(result, { _id: 'abc' });
  });

  it('createDefault delegates to the DAO', async () => {
    const result = await service.createDefault({ name: 'y' });
    assert.deepStrictEqual(result, { name: 'y' });
  });

  it('updateDefault delegates to the DAO', async () => {
    const result = await service.updateDefault('abc', { name: 'z' });
    assert.deepStrictEqual(result, { _id: 'abc', name: 'z' });
  });

  it('activateDefault delegates to the DAO', async () => {
    const result = await service.activateDefault('abc');
    assert.deepStrictEqual(result, { _id: 'abc', active: true });
  });

  it('deactivateDefault delegates to the DAO', async () => {
    const result = await service.deactivateDefault('abc');
    assert.deepStrictEqual(result, { _id: 'abc', active: false });
  });
});
