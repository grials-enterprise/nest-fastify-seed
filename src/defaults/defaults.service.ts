import { Injectable } from '@nestjs/common';
import { DefaultsDaos } from './defaults.daos.js';

@Injectable()
export class DefaultsService {
  constructor(private readonly defaultsDao: DefaultsDaos) {}

  async paginateDefault(query: any) {
    return await this.defaultsDao.paginateDefault(query);
  }
  async listDefault(query: any) {
    return await this.defaultsDao.listDefault(query);
  }
  async getDefaultById(id: string) {
    return await this.defaultsDao.getDefaultById(id);
  }
  async createDefault(data: any) {
    return await this.defaultsDao.createDefault(data);
  }
  async updateDefault(id: string, data: any) {
    return await this.defaultsDao.updateDefault(id, data);
  }
  async activateDefault(id: string) {
    return await this.defaultsDao.activateDefault(id);
  }
  async deactivateDefault(id: string) {
    return await this.defaultsDao.deactivateDefault(id);
  }
}
