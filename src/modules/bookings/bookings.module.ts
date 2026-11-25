import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { ResourcesModule } from '../resources/resources.module';
import { UsersModule } from '../users/users.module';
import { BOOKING_REPOSITORY } from './application/booking.repository';
import { PrismaBookingRepository } from './infrastructure/prisma-booking.repository';
import { CreateHoldUseCase } from './application/create-hold.use-case';
import { BookingsController } from './presentation/bookings.controller';
import { CLOCK } from '../../common/time/clock';
import { SystemClock } from '../../common/time/system-clock';

@Module({
  imports: [DatabaseModule, ResourcesModule, UsersModule],
  controllers: [BookingsController],
  providers: [
    {
      provide: BOOKING_REPOSITORY,
      useClass: PrismaBookingRepository,
    },
    CreateHoldUseCase,
    {
      provide: CLOCK,
      useClass: SystemClock,
    },
  ],
  exports: [BOOKING_REPOSITORY, CreateHoldUseCase],
})
export class BookingsModule {}
