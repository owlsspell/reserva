import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './presentation/auth.controller';
import { RegisterUserUseCase } from './application/register-user.use-case';
import { LoginUserUseCase } from './application/login-user.use-case';
import { RefreshTokenUseCase } from './application/refresh-token.use-case';
import { LogoutUserUseCase } from './application/logout-user.use-case';
import { USER_REPOSITORY } from './application/ports/user.repository';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { PASSWORD_HASHER } from './application/ports/password-hasher';
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher';
import { REFRESH_TOKEN_REPOSITORY } from './application/ports/refresh-token.repository';
import { PrismaRefreshTokenRepository } from './infrastructure/prisma-refresh-token.repository';
import { CLOCK } from '../../common/time/clock';
import { SystemClock } from '../../common/time/system-clock';
import { DatabaseModule } from '../../infrastructure/database/database.module';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.get<number>('JWT_ACCESS_TTL_SECONDS', 900),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    LoginUserUseCase,
    RefreshTokenUseCase,
    LogoutUserUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useClass: Argon2PasswordHasher,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: PrismaRefreshTokenRepository,
    },
    {
      provide: CLOCK,
      useClass: SystemClock,
    },
  ],
  exports: [USER_REPOSITORY, REFRESH_TOKEN_REPOSITORY],
})
export class UsersModule {}
