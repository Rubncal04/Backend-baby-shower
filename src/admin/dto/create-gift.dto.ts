export class CreateGiftDto {
  name: string;
  tier: 'costoso' | 'economico';
  icon?: string;
  order?: number;
  visible?: boolean;
}
