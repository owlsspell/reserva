import { IsString, IsInt, Min, Max, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class ScheduleRuleDto {
  @ApiProperty({ example: 1, description: 'Weekday 0 (Sunday) to 6 (Saturday)' })
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @ApiProperty({ example: '09:00', description: 'Opening time HH:mm' })
  @IsString()
  @IsNotEmpty()
  opensAt!: string;

  @ApiProperty({ example: '17:00', description: 'Closing time HH:mm' })
  @IsString()
  @IsNotEmpty()
  closesAt!: string;
}

export class UpdateScheduleDto {
  @ApiProperty({ type: [ScheduleRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleRuleDto)
  schedules!: ScheduleRuleDto[];
}
