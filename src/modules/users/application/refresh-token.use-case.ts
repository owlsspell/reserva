import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from './ports/refresh-token.repository';
import { USER_REPOSITORY, UserRepository } from './ports/user.repository';
import { CLOCK, Clock } from '../../../common/time/clock';
import {
  UnauthenticatedError,
  TokenExpiredError,
  RefreshTokenReusedError,
} from '../domain/auth-errors';
import { RefreshTokenEntity } from '../domain/refresh-token.entity';
import { AuthTokensResult } from './login-user.use-case';

export interface RefreshTokenCommand {
  refreshToken: string;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<AuthTokensResult> {
    const tokenHash = crypto.createHash('sha256').update(command.refreshToken).digest('hex');
    const token = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    const now = this.clock.now();

    if (!token) {
      throw new UnauthenticatedError('Refresh token not found');
    }

    if (token.isExpired(now)) {
      throw new TokenExpiredError('Refresh token has expired');
    }

    if (token.isRevoked()) {
      // Reuse detection! Revoke the entire family
      await this.refreshTokenRepository.revokeFamily(token.familyId);
      throw new RefreshTokenReusedError('Refresh token reuse detected. Family revoked.');
    }

    const user = await this.userRepository.findById(token.userId);
    if (!user) {
      throw new UnauthenticatedError('User not found');
    }

    // Revoke current token and replace with new one in the same family
    const rawNewRefreshToken = crypto.randomBytes(32).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(rawNewRefreshToken).digest('hex');
    const refreshTokenTtl = this.configService.get<number>('JWT_REFRESH_TTL_SECONDS', 604800);
    const expiresAt = new Date(now.getTime() + refreshTokenTtl * 1000);

    await this.refreshTokenRepository.revokeToken(token.id, newTokenHash);

    const newTokenEntity = RefreshTokenEntity.create(
      crypto.randomUUID(),
      user.id,
      token.familyId,
      newTokenHash,
      expiresAt,
    );
    await this.refreshTokenRepository.save(newTokenEntity);

    const accessTokenTtl = this.configService.get<number>('JWT_ACCESS_TTL_SECONDS', 900);
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessTokenTtl,
      },
    );

    return {
      accessToken,
      refreshToken: rawNewRefreshToken,
      expiresIn: accessTokenTtl,
    };
  }
}
