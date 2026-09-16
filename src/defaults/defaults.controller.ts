import {
  Get,
  Body,
  Post,
  Param,
  Patch,
  Query,
  HttpCode,
  Controller,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { DefaultsService } from './defaults.service.js';
import { CryptoDefaultsInterceptor } from './crypto.interceptor.js';
import { ResponseMessage } from '../common/decorators/response-message.decorator.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { AjvValidationPipe } from '../common/pipes/ajv-validation.pipe.js';
import { defaultSchema } from '../common/ajv/schemas/default.schema.js';

@ApiTags('defaults')
@UseInterceptors(CryptoDefaultsInterceptor)
@Controller({ path: 'defaults', version: '1.0.0' })
export class DefaultsController {
  constructor(private readonly defaultsService: DefaultsService) {}

  @Get()
  @ApiOperation({ summary: 'List defaults' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'select', required: false, type: String })
  @ApiQuery({ name: 'filter', required: false, type: String })
  @ResponseMessage('defaults list successfully')
  async listDefault(@Query() query: any) {
    return await this.defaultsService.listDefault(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get default by id' })
  @ApiParam({ name: 'id', type: String, description: 'Mongo ObjectId' })
  @ResponseMessage('default retrieved successfully')
  async getDefaultById(@Param('id', ParseObjectIdPipe) id: string) {
    return await this.defaultsService.getDefaultById(id);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create default' })
  @ApiBody({ schema: defaultSchema })
  @ResponseMessage('default created successfully')
  async createDefault(@Body(AjvValidationPipe('default')) data: any) {
    return await this.defaultsService.createDefault(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update default' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: defaultSchema })
  @ResponseMessage('default updated successfully')
  async updateDefault(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body(AjvValidationPipe('default')) data: any,
  ) {
    return await this.defaultsService.updateDefault(id, data);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate default' })
  @ApiParam({ name: 'id', type: String })
  @ResponseMessage('default activated successfully')
  async activateDefault(@Param('id', ParseObjectIdPipe) id: string) {
    return await this.defaultsService.activateDefault(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate default' })
  @ApiParam({ name: 'id', type: String })
  @ResponseMessage('default deactivated successfully')
  async deactivateDefault(@Param('id', ParseObjectIdPipe) id: string) {
    return await this.defaultsService.deactivateDefault(id);
  }
}
