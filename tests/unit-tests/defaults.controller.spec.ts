import * as assert from 'assert';
import { Test } from '@nestjs/testing';
import { DefaultsController } from '../../src/defaults/defaults.controller.js';
import { DefaultsService } from '../../src/defaults/defaults.service.js';
import { CryptoDefaultsInterceptor } from '../../src/defaults/crypto.interceptor.js';
import { AppConfigService } from '../../src/config/config.service.js';

describe('DefaultsController', () => {
  let controller: DefaultsController;

  const serviceMock = {
    listDefault: async (q: any) => ({ q }),
    getDefaultById: async (id: string) => ({ id }),
    createDefault: async (d: any) => d,
    updateDefault: async (id: string, d: any) => ({ id, ...d }),
    activateDefault: async (id: string) => ({ id, active: true }),
    deactivateDefault: async (id: string) => ({ id, active: false }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [DefaultsController],
      providers: [
        { provide: DefaultsService, useValue: serviceMock },
        CryptoDefaultsInterceptor,
        { provide: AppConfigService, useValue: {} },
      ],
    }).compile();

    controller = moduleRef.get(DefaultsController);
  });

  it('listDefault delegates to the service', async () => {
    const result = await controller.listDefault({ skip: 1 });
    assert.deepStrictEqual(result, { q: { skip: 1 } });
  });

  it('getDefaultById delegates to the service', async () => {
    const result = await controller.getDefaultById('abc');
    assert.deepStrictEqual(result, { id: 'abc' });
  });

  it('createDefault delegates to the service', async () => {
    const result = await controller.createDefault({ name: 'x' });
    assert.deepStrictEqual(result, { name: 'x' });
  });

  it('updateDefault delegates to the service', async () => {
    const result = await controller.updateDefault('abc', { name: 'y' });
    assert.deepStrictEqual(result, { id: 'abc', name: 'y' });
  });

  it('activateDefault delegates to the service', async () => {
    const result = await controller.activateDefault('abc');
    assert.deepStrictEqual(result, { id: 'abc', active: true });
  });

  it('deactivateDefault delegates to the service', async () => {
    const result = await controller.deactivateDefault('abc');
    assert.deepStrictEqual(result, { id: 'abc', active: false });
  });
});
