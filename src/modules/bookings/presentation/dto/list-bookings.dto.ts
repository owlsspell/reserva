import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '../../domain/booking';

export class ListBookingsQueryDto {
  @ApiPropertyOptional({ enum: ['held', 'confirmed', 'cancelled', 'expired'] })
  @IsOptional()
  @IsEnum(['held', 'confirmed', 'cancelled', 'expired'])
  status?: BookingStatus;

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00Z' })
  @IsOptional()
  @Type(() => Date)
  from?: Date;

  @ApiPropertyOptional({ example: '2026-03-01T23:59:59Z' })
  @IsOptional()
  @Type(() => Date)
  to?: Date;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 'eyJpZCI6...' })
  @IsOptional()
  @IsString()
  cursor?: string;
}
