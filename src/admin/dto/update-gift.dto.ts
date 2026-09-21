export class UpdateGiftDto {
  name?: string;
  tier?: 'costoso' | 'economico' | 'oculto';
  icon?: string;
  order?: number;
  visible?: boolean;
}
