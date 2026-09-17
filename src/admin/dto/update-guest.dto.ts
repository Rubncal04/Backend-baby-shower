export class UpdateGuestDto {
  name?: string;
  phone?: string | null;
  type?: 'familia' | 'amigos';
  groupKey?: string;
  groupName?: string;
}
