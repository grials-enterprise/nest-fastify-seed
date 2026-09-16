import * as assert from 'assert';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { DefaultsDaos } from '../../src/defaults/defaults.daos.js';
import { DefaultSchemaBase } from '../../src/defaults/defaults.schema.js';

describe('DefaultsDaos', () => {
  let daos: DefaultsDaos;
  let results: any;
  let calls: any;

  const getModel = () => {
    class FakeModel {
      constructor(public data: any) {}
      async save() {
        return { toObject: () => this.data };
      }
    }
    Object.assign(FakeModel, {
      countDocuments: async (...a: any[]) => {
        calls.countDocuments.push(a);
        return results.countDocuments;
      },
      find: (...a: any[]) => {
        calls.find.push(a);
        return { lean: async () => results.find };
      },
      findOne: (...a: any[]) => {
        calls.findOne.push(a);
        return { lean: async () => results.findOne };
      },
      findOneAndUpdate: (...a: any[]) => {
        calls.findOneAndUpdate.push(a);
        return { lean: async () => results.findOneAndUpdate };
      },
      paginate: async (...a: any[]) => {
        calls.paginate.push(a);
        return results.paginate;
      },
    });
    return FakeModel;
  };

  beforeEach(async () => {
    results = {
      countDocuments: 0,
      find: [],
      findOne: null,
      findOneAndUpdate: null,
      paginate: { docs: [], totalDocs: 0 },
    };
    calls = {
      countDocuments: [],
      find: [],
      findOne: [],
      findOneAndUpdate: [],
      paginate: [],
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        DefaultsDaos,
        { provide: getModelToken(DefaultSchemaBase.name), useValue: getModel() },
      ],
    }).compile();

    daos = moduleRef.get(DefaultsDaos);
  });

  it('existsDefault returns true when there are documents', async () => {
    results.countDocuments = 1;
    const result = await daos.existsDefault('507f1f77bcf86cd799439011');
    assert.strictEqual(result, true);
    assert.strictEqual(calls.countDocuments.length, 1);
  });

  it('existsDefault returns false when there are no documents', async () => {
    results.countDocuments = 0;
    const result = await daos.existsDefault('507f1f77bcf86cd799439011');
    assert.strictEqual(result, false);
  });

  it('createDefault creates and returns the serialized document', async () => {
    const data = { name: 'x', text: 'hello' };
    const result = await daos.createDefault(data);
    assert.deepStrictEqual(result, data);
  });

  it('paginateDefault applies $text search and maps docs', async () => {
    results.paginate = {
      docs: [{ toObject: () => ({ name: 'a' }) }],
      totalDocs: 1,
      limit: 10,
      page: 1,
    };
    const query = { filter: { text: 'hello' }, select: 'name', skip: 1, limit: 10 };
    const result = await daos.paginateDefault(query);

    assert.strictEqual(result.totalDocs, 1);
    assert.deepStrictEqual(result.docs, [{ name: 'a' }]);
    assert.strictEqual(query.filter.text, undefined);
    const [filter, options] = calls.paginate[0];
    assert.ok(filter.$text);
    assert.strictEqual(options.select, 'name');
    assert.strictEqual(options.page, 1);
    assert.strictEqual(options.limit, 10);
  });

  it('paginateDefault without text does not build $text', async () => {
    results.paginate = { docs: [], totalDocs: 0 };
    const result = await daos.paginateDefault({ filter: {}, skip: 2, limit: 5 });
    assert.strictEqual(result.totalDocs, 0);
    const [filter] = calls.paginate[0];
    assert.strictEqual(filter.$text, undefined);
    assert.strictEqual(filter.active, true);
  });

  it('listDefault without text calls find with lean', async () => {
    results.find = [{ name: 'a' }];
    const result = await daos.listDefault({ filter: {}, select: 'name' });
    assert.deepStrictEqual(result, [{ name: 'a' }]);
    const [filter, select, options] = calls.find[0];
    assert.strictEqual(filter.active, true);
    assert.strictEqual(select, 'name');
    assert.ok(options);
  });

  it('listDefault with text builds $text', async () => {
    results.find = [];
    const query = { filter: { text: 'x' } };
    await daos.listDefault(query);
    const [filter] = calls.find[0];
    assert.ok(filter.$text);
    assert.strictEqual(query.filter.text, undefined);
  });

  it('getDefaultById searches by id and active', async () => {
    results.findOne = { _id: 'abc', name: 'a' };
    const result = await daos.getDefaultById('abc');
    assert.deepStrictEqual(result, { _id: 'abc', name: 'a' });
    assert.deepStrictEqual(calls.findOne[0][0], { _id: 'abc', active: true });
  });

  it('updateDefault updates with $set', async () => {
    results.findOneAndUpdate = { _id: 'abc', name: 'z' };
    const result = await daos.updateDefault('abc', { name: 'z' });
    assert.deepStrictEqual(result, { _id: 'abc', name: 'z' });
    const [filter, update, options] = calls.findOneAndUpdate[0];
    assert.deepStrictEqual(filter, { _id: 'abc', active: true });
    assert.deepStrictEqual(update, { $set: { name: 'z' } });
    assert.strictEqual(options.returnDocument, 'after');
  });

  it('deactivateDefault sets active:false', async () => {
    results.findOneAndUpdate = { _id: 'abc', active: false };
    const result = await daos.deactivateDefault('abc');
    assert.strictEqual(result.active, false);
    const [, update] = calls.findOneAndUpdate[0];
    assert.deepStrictEqual(update, { active: false });
  });

  it('activateDefault sets active:true', async () => {
    results.findOneAndUpdate = { _id: 'abc', active: true };
    const result = await daos.activateDefault('abc');
    assert.strictEqual(result.active, true);
    const [filter, update] = calls.findOneAndUpdate[0];
    assert.deepStrictEqual(filter, { _id: 'abc', active: false });
    assert.deepStrictEqual(update, { active: true });
  });
});
