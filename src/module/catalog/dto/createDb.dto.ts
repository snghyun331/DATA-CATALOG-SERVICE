import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateDbDto {
  @ApiProperty({ type: String, description: 'DB Host', required: true })
  @IsString()
  host: string;

  @ApiProperty({ type: Number, description: 'DB Port', required: true })
  @IsNumber()
  port: number;

  @ApiProperty({ type: String, description: 'DB User', required: true })
  @IsString()
  userName: string;

  @ApiProperty({ type: String, description: 'DB Password', required: true })
  @IsString()
  password: string;

  @ApiProperty({ type: String, description: 'DB Name', required: true })
  @IsString()
  dbName: string;
}
