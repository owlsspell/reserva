import { IsString, IsInt, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateResourceDto {
  @ApiProperty({ example: 'Conference Room A', description: 'Name of the resource' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Spacious room with projector', description: 'Description' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 'room', description: 'Type of resource (room, desk, court)' })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiProperty({ example: 10, description: 'Capacity' })
  @IsInt()
  @Min(1)
  capacity!: number;

  @ApiProperty({ example: 'Kyiv', description: 'City' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: 'Europe/Kyiv', description: 'IANA timezone' })
  @IsString()
  @IsNotEmpty()
  timezone!: string;

  @ApiProperty({ example: 5000, description: 'Price per hour in minor units (cents)' })
  @IsInt()
  @Min(0)
  pricePerHour!: number;
}
