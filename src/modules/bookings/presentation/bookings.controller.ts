import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../users/presentation/guards/jwt-auth.guard';
import { CreateHoldUseCase } from '../application/create-hold.use-case';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtPayload } from '../../users/presentation/guards/jwt-auth.guard';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly createHoldUseCase: CreateHoldUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a booking hold' })
  @ApiResponse({ status: 201, description: 'Hold created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or start time in past' })
  @ApiResponse({ status: 409, description: 'Slot unavailable or hold limit reached' })
  async createHold(@Req() req: Request & { user: JwtPayload }, @Body() dto: CreateBookingDto) {
    const booking = await this.createHoldUseCase.execute({
      userId: req.user.sub,
      resourceId: dto.resourceId,
      startsAt: new Date(dto.startsAt),
      endsAt: new Date(dto.endsAt),
    });

    return {
      id: booking.id,
      resourceId: booking.resourceId,
      userId: booking.userId,
      startsAt: booking.range.start.toISOString(),
      endsAt: booking.range.end.toISOString(),
      status: booking.status,
      holdExpiresAt: booking.holdExpiresAt.toISOString(),
      amountMinor: booking.amount.amountMinor,
      currency: booking.amount.currency,
      createdAt: booking.createdAt.toISOString(),
    };
  }
}
