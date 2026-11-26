import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../users/presentation/guards/jwt-auth.guard';
import { CreateHoldUseCase } from '../application/create-hold.use-case';
import { GetBookingsUseCase } from '../application/get-bookings.use-case';
import { GetBookingByIdUseCase } from '../application/get-booking-by-id.use-case';
import { CancelBookingUseCase } from '../application/cancel-booking.use-case';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ListBookingsQueryDto } from './dto/list-bookings.dto';
import { JwtPayload } from '../../users/presentation/guards/jwt-auth.guard';
import { Booking } from '../domain/booking';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly createHoldUseCase: CreateHoldUseCase,
    private readonly getBookingsUseCase: GetBookingsUseCase,
    private readonly getBookingByIdUseCase: GetBookingByIdUseCase,
    private readonly cancelBookingUseCase: CancelBookingUseCase,
  ) {}

  private mapBookingResponse(booking: Booking) {
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
      updatedAt: booking.updatedAt.toISOString(),
    };
  }

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

    return this.mapBookingResponse(booking);
  }

  @Get()
  @ApiOperation({ summary: 'List own bookings with filters and cursor pagination' })
  @ApiResponse({ status: 200, description: 'List of bookings' })
  async listBookings(
    @Req() req: Request & { user: JwtPayload },
    @Query() query: ListBookingsQueryDto,
  ) {
    // Note: GET /bookings returns own bookings. Admin /admin/bookings will return all.
    const result = await this.getBookingsUseCase.execute({
      userId: req.user.sub,
      limit: query.limit,
      cursor: query.cursor,
      status: query.status,
      from: query.from,
      to: query.to,
    });

    return {
      data: result.data.map((b) => this.mapBookingResponse(b)),
      page: {
        nextCursor: result.nextCursor,
        hasMore: result.nextCursor !== null,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details by ID' })
  @ApiResponse({ status: 200, description: 'Booking details' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 410, description: 'Booking hold expired' })
  async getBooking(@Req() req: Request & { user: JwtPayload }, @Param('id') id: string) {
    const isAdmin = req.user.role === 'admin';
    const booking = await this.getBookingByIdUseCase.execute(id, req.user.sub, isAdmin);
    return this.mapBookingResponse(booking);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel booking or release hold' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 409, description: 'Invalid state transition' })
  @ApiResponse({ status: 410, description: 'Hold expired' })
  async cancelBooking(@Req() req: Request & { user: JwtPayload }, @Param('id') id: string) {
    const isAdmin = req.user.role === 'admin';
    const booking = await this.cancelBookingUseCase.execute(id, req.user.sub, isAdmin);
    return this.mapBookingResponse(booking);
  }
}
