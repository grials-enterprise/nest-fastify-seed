import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DefaultDocument, DefaultSchemaBase } from './defaults.schema.js';

@Injectable()
export class DefaultsDaos {
  constructor(
    @InjectModel(DefaultSchemaBase.name)
    private readonly model: Model<DefaultDocument>,
  ) {}

  async existsDefault(id: string): Promise<boolean> {
    return (await this.model.countDocuments({
      _id: Types.ObjectId.createFromHexString(id),
    }))
      ? true
      : false;
  }
  async createDefault(data: string): Promise<DefaultDocument> {
    const newDefault = new this.model(data);
    return await newDefault.save().then((item) => item.toObject());
  }

  async paginateDefault(query: any): Promise<{
    docs: DefaultDocument[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  }> {
    const text = query?.filter?.text ? `${query.filter.text}` : '';
    let search = {};
    if (query?.filter?.text) {
      search = {
        $text: {
          $search: text,
          $caseSensitive: true,
          $diacriticSensitive: false,
        },
      };
      delete query.filter.text;
    }

    return await (this.model as any)
      .paginate(Object.assign({ active: true }, query.filter, search), {
        select: query.select,
        page: query.skip ? query.skip : 1,
        limit: query.limit,
        sort: query.sort,
      })
      .then((data: any) => {
        return {
          ...data,
          docs: data.docs.map((item: any) => item.toObject()),
        };
      });
  }

  async listDefault(query: any): Promise<DefaultDocument[]> {
    const text = query?.filter?.text ? `${query.filter.text}` : '';
    let search = {};
    if (query?.filter?.text) {
      search = {
        $text: {
          $search: text,
          $caseSensitive: true,
          $diacriticSensitive: false,
        },
      };
      delete query.filter.text;
    }

    return await this.model
      .find(
        Object.assign({ active: true }, query.filter, search),
        query.select,
        {
          sort: query.sort,
          limit: query.limit,
          skip: query.skip,
        },
      )
      .lean();
  }

  async getDefaultById(id: string): Promise<DefaultDocument | null> {
    return await this.model.findOne({ _id: id, active: true }).lean();
  }

  async updateDefault(id: string, data: any): Promise<DefaultDocument | null> {
    return await this.model
      .findOneAndUpdate(
        { _id: id, active: true },
        {
          $set: {
            ...data,
          },
        },
        { returnDocument: 'after', runValidators: true },
      )
      .lean();
  }

  async deactivateDefault(id: string): Promise<DefaultDocument | null> {
    return await this.model
      .findOneAndUpdate(
        { _id: id, active: true },
        { active: false },
        { returnDocument: 'after', runValidators: true },
      )
      .lean();
  }

  async activateDefault(id: string): Promise<DefaultDocument | null> {
    return await this.model
      .findOneAndUpdate(
        { _id: id, active: false },
        { active: true },
        { returnDocument: 'after', runValidators: true },
      )
      .lean();
  }
}
