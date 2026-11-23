import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { USER_REPOSITORY, UserRepository } from './ports/user.repository';
import { PASSWORD_HASHER, PasswordHasher } from './ports/password-hasher';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from './ports/refresh-token.repository';
import { CLOCK, Clock } from '../../../common/time/clock';
import { UnauthenticatedError } from '../domain/auth-errors';
import { RefreshTokenEntity } from '../domain/refresh-token.entity';
import { User } from '../domain/user.entity';

export interface LoginUserCommand {
  email: string;
  password: string;
}

export interface AuthTokensResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: LoginUserCommand): Promise<{ user: User; tokens: AuthTokensResult }> {
    const user = await this.userRepository.findByEmail(command.email);
    if (!user) {
      throw new UnauthenticatedError('Invalid email or password');
    }

    const isPasswordValid = await this.passwordHasher.compare(command.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthenticatedError('Invalid email or password');
    }

    const accessTokenTtl = this.configService.get<number>('JWT_ACCESS_TTL_SECONDS', 900);
    const refreshTokenTtl = this.configService.get<number>('JWT_REFRESH_TTL_SECONDS', 604800);

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessTokenTtl,
      },
    );

    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const familyId = crypto.randomUUID();
    const now = this.clock.now();
    const expiresAt = new Date(now.getTime() + refreshTokenTtl * 1000);

    const refreshTokenEntity = RefreshTokenEntity.create(
      crypto.randomUUID(),
      user.id,
      familyId,
      tokenHash,
      expiresAt,
    );

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      user,
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
        expiresIn: accessTokenTtl,
      },
    };
  }
}
