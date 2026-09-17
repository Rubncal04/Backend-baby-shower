import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { GuestType } from './guest.schema';

export type GroupDocument = HydratedDocument<Group>;

@Schema({ collection: 'groups', timestamps: true, id: false })
export class Group {
  @Prop({ required: true, unique: true, index: true })
  key: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['familia', 'amigos'], index: true })
  type: GuestType;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
