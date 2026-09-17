export class CreateGroupDto {
  name: string;
  type: 'familia' | 'amigos';
  key?: string;
}
