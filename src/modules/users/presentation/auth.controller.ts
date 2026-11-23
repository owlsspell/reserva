import { Body, Controller, Post, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  LogoutDto,
  UserResponseDto,
  AuthTokensResponseDto,
  RegisterResponseDto,
} from './user.dto';
import { RegisterUserUseCase } from '../application/register-user.use-case';
import { LoginUserUseCase } from '../application/login-user.use-case';
import { RefreshTokenUseCase } from '../application/refresh-token.use-case';
import { LogoutUserUseCase } from '../application/logout-user.use-case';

@ApiTags('auth')
@Controller('auth')
@Throttle({ default: { limit: 5, ttl: 60000 } })
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUserUseCase: LogoutUserUseCase,
  ) {}

  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: RegisterResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email already taken' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    const user = await this.registerUserUseCase.execute({
      email: dto.email,
      password: dto.password,
      name: dto.name,
    });
    const { tokens } = await this.loginUserUseCase.execute({
      email: dto.email,
      password: dto.password,
    });
    return {
      user: UserResponseDto.from(user),
      tokens,
    };
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthTokensResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async login(@Body() dto: LoginDto): Promise<AuthTokensResponseDto> {
    const { tokens } = await this.loginUserUseCase.execute({
      email: dto.email,
      password: dto.password,
    });
    return tokens;
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Tokens rotated successfully',
    type: AuthTokensResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthenticated / Expired / Reused refresh token' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokensResponseDto> {
    return this.refreshTokenUseCase.execute({
      refreshToken: dto.refreshToken,
    });
  }

  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Logout and revoke refresh token family' })
  @ApiResponse({ status: 204, description: 'Logged out successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async logout(@Body() dto: LogoutDto): Promise<void> {
    await this.logoutUserUseCase.execute({
      refreshToken: dto.refreshToken,
    });
  }
}
