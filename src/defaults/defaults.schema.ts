import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class DefaultSchemaBase {
  @Prop({ required: true }) name: string;
  @Prop() text: string;
  @Prop({ default: true }) active: boolean;
}

export type DefaultDocument = HydratedDocument<DefaultSchemaBase>;
export const DefaultSchema = SchemaFactory.createForClass(DefaultSchemaBase);
