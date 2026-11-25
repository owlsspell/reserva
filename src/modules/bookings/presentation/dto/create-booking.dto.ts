import { IsString, IsNotEmpty, IsISO8601 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Resource ID' })
  @IsString()
  @IsNotEmpty()
  resourceId!: string;

  @ApiProperty({ example: '2026-12-01T10:00:00.000Z', description: 'Start time (UTC ISO8601)' })
  @IsISO8601()
  @IsNotEmpty()
  startsAt!: string;

  @ApiProperty({ example: '2026-12-01T12:00:00.000Z', description: 'End time (UTC ISO8601)' })
  @IsISO8601()
  @IsNotEmpty()
  endsAt!: string;
}
