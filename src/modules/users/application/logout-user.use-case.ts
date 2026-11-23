import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from './ports/refresh-token.repository';

export interface LogoutUserCommand {
  refreshToken: string;
}

@Injectable()
export class LogoutUserUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(command: LogoutUserCommand): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(command.refreshToken).digest('hex');
    const token = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (token) {
      await this.refreshTokenRepository.revokeFamily(token.familyId);
    }
  }
}
