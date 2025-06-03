import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsString, Matches } from 'class-validator';

export class CreateDbDto {
  @ApiProperty({ type: String, description: '고객사 코드', example: 'LOTTE', required: true })
  @IsString()
  @Matches(/^[A-Za-z-]+$/, {
    message: '영문자와 하이픈(-)만 입력가능합니다.',
  })
  @Transform(({ value }) => value.toUpperCase())
  @Transform(({ value }) => value.replace(/\s+/g, ''))
  companyCode: string;

  @ApiProperty({ type: String, description: '고객사명', example: '롯데', required: true })
  @IsString()
  companyName: string;

  @ApiProperty({ type: String, description: 'DB Host', example: '115.68.68.138', required: true })
  @IsString()
  dbHost: string;

  @ApiProperty({ type: Number, description: 'DB Port', example: 3306, required: true })
  @IsNumber()
  dbPort: number;

  @ApiProperty({ type: String, description: 'DB User', example: 'root', required: true })
  @IsString()
  dbUser: string;

  @ApiProperty({ type: String, description: 'DB Password', example: 'insahr1234', required: true })
  @IsString()
  dbPw: string;

  @ApiProperty({ type: String, description: 'DB Name', example: 'cj2023', required: true })
  @IsString()
  dbName: string;

  @ApiProperty({ type: String, description: 'DB Tag', example: 'backup', required: true })
  @IsString()
  dbTag: string;
}
