import {
  HttpStatus,
  Injectable,
  HttpException,
  PipeTransform,
} from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform {
  transform(value: string): string {
    if (!Types.ObjectId.isValid(value)) {
      throw new HttpException('[II000]: invalid id', HttpStatus.BAD_REQUEST);
    }
    return value;
  }
}
