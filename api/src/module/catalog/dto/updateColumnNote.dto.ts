import { IsString } from 'class-validator';

export class UpdateColumnNoteDto {
  @IsString()
  note: string;
}
