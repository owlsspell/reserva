import { IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBlackoutDto {
  @ApiProperty({ example: '2026-12-25T00:00:00.000Z', description: 'Start timestamp (ISO UTC)' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: '2026-12-26T00:00:00.000Z', description: 'End timestamp (ISO UTC)' })
  @IsDateString()
  endsAt!: string;

  @ApiProperty({ example: 'Maintenance', description: 'Reason for blackout' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
