import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateTableDescriptionDto {
  @ApiProperty({ name: 'description' })
  @IsString()
  description: string;
}
