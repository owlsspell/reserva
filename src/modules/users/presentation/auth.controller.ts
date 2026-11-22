import { Body, Controller, Post, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegisterDto, UserResponseDto } from './user.dto';
import { RegisterUserUseCase } from '../application/register-user.use-case';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly registerUserUseCase: RegisterUserUseCase) {}

  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully', type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email already taken' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async register(@Body() dto: RegisterDto): Promise<UserResponseDto> {
    const user = await this.registerUserUseCase.execute({
      email: dto.email,
      password: dto.password,
      name: dto.name,
    });
    return UserResponseDto.from(user);
  }
}
