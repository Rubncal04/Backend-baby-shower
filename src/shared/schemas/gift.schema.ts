import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GiftDocument = HydratedDocument<Gift>;

export type GiftTier = 'costoso' | 'economico' | 'oculto';

@Schema({ collection: 'gifts', timestamps: true, id: false })
export class Gift {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  icon: string;

  @Prop({ required: true })
  order: number;

  @Prop({ required: true, enum: ['costoso', 'economico', 'oculto'] })
  tier: GiftTier;

  @Prop({ default: true })
  visible: boolean;

  @Prop({ default: false })
  preReserved: boolean;

  @Prop({ default: false, index: true })
  reserved: boolean;

  @Prop({ type: String, default: null })
  reservedByGuestId: string | null;

  @Prop({ type: String, default: null })
  reservedByName: string | null;

  @Prop({ type: String, default: null })
  reservedByGroupKey: string | null;

  @Prop({ type: Date, default: null })
  reservedAt: Date | null;
}

export const GiftSchema = SchemaFactory.createForClass(Gift);

GiftSchema.index(
  { reservedByGroupKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      reserved: true,
      reservedByGroupKey: { $type: 'string' },
    },
  },
);
