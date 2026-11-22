import { Module } from '@nestjs/common';
import { AuthController } from './presentation/auth.controller';
import { RegisterUserUseCase } from './application/register-user.use-case';
import { USER_REPOSITORY } from './application/ports/user.repository';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { PASSWORD_HASHER } from './application/ports/password-hasher';
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher';
import { DatabaseModule } from '../../infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useClass: Argon2PasswordHasher,
    },
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
