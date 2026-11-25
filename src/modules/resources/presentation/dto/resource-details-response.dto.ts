import { ApiProperty } from '@nestjs/swagger';

export class ScheduleResponseDto {
  @ApiProperty({ example: 1, description: 'Weekday (0=Sunday, 1=Monday, ..., 6=Saturday)' })
  weekday!: number;

  @ApiProperty({ example: '09:00', description: 'Opens at (HH:mm)' })
  opensAt!: string;

  @ApiProperty({ example: '17:00', description: 'Closes at (HH:mm)' })
  closesAt!: string;
}

export class BlackoutResponseDto {
  @ApiProperty({ example: '01900000-0000-0000-0000-000000000000' })
  id!: string;

  @ApiProperty({ example: '2026-12-25T00:00:00.000Z' })
  startsAt!: Date;

  @ApiProperty({ example: '2026-12-26T00:00:00.000Z' })
  endsAt!: Date;

  @ApiProperty({ example: 'Maintenance' })
  reason!: string;
}

export class ResourceDetailsResponseDto {
  @ApiProperty({ example: '01900000-0000-0000-0000-000000000000' })
  id!: string;

  @ApiProperty({ example: 'Conference Room A' })
  name!: string;

  @ApiProperty({ example: 'Spacious room with projector' })
  description!: string;

  @ApiProperty({ example: 'room' })
  type!: string;

  @ApiProperty({ example: 10 })
  capacity!: number;

  @ApiProperty({ example: 'Kyiv' })
  city!: string;

  @ApiProperty({ example: 'Europe/Kyiv' })
  timezone!: string;

  @ApiProperty({ example: 5000, description: 'Price per hour in minor units' })
  pricePerHour!: number;

  @ApiProperty({ type: [ScheduleResponseDto] })
  schedules!: ScheduleResponseDto[];

  @ApiProperty({ type: [BlackoutResponseDto] })
  blackouts!: BlackoutResponseDto[];
}
