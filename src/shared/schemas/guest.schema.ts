import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GuestDocument = HydratedDocument<Guest>;

export type GuestType = 'familia' | 'amigos';
export type AttendanceStatus = boolean | null;

@Schema({ collection: 'guests', timestamps: true, id: false })
export class Guest {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: String, default: null, index: true })
  phone: string | null;

  @Prop({ required: true, enum: ['familia', 'amigos'] })
  type: GuestType;

  @Prop({ required: true, index: true })
  groupKey: string;

  @Prop({ required: true })
  groupName: string;

  @Prop({ type: Boolean, default: null })
  attending: AttendanceStatus;

  @Prop({ type: Date, default: null })
  attendingAt: Date | null;

  @Prop({ required: true, unique: true, index: true })
  accessToken: string;
}

export const GuestSchema = SchemaFactory.createForClass(Guest);
