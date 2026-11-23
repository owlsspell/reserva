import { Controller, Get, HttpCode, UseGuards, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { GetMeUseCase } from '../application/get-me.use-case';
import { UserResponseDto } from './user.dto';
import { JwtAuthGuard, JwtPayload } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('me')
@UseGuards(JwtAuthGuard, RolesGuard)
@Throttle({ default: { limit: 100, ttl: 60000 } })
export class MeController {
  constructor(private readonly getMeUseCase: GetMeUseCase) {}

  @Get()
  @HttpCode(200)
  @Roles('customer', 'admin')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getMe(@Req() req: Request & { user: JwtPayload }): Promise<UserResponseDto> {
    const user = await this.getMeUseCase.execute({ userId: req.user.sub });
    return UserResponseDto.from(user);
  }
}
