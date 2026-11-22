import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'customer@reserva.dev' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  name!: string;
}

export class UserResponseDto {
  @ApiProperty({ example: '01900000-0000-0000-0000-000000000000' })
  id!: string;

  @ApiProperty({ example: 'customer@reserva.dev' })
  email!: string;

  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiProperty({ example: 'customer' })
  role!: string;

  @ApiProperty({ example: '2026-03-01T10:00:00Z' })
  createdAt!: string;

  static from(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: Date;
  }): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.name = user.name;
    dto.role = user.role;
    dto.createdAt = user.createdAt.toISOString();
    return dto;
  }
}
