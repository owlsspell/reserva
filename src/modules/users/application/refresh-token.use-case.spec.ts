import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { RefreshTokenUseCase } from './refresh-token.use-case';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from './ports/refresh-token.repository';
import { USER_REPOSITORY, UserRepository } from './ports/user.repository';
import { CLOCK, Clock } from '../../../common/time/clock';
import { RefreshTokenEntity } from '../domain/refresh-token.entity';
import { TokenExpiredError, RefreshTokenReusedError } from '../domain/auth-errors';
import { User } from '../domain/user.entity';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let refreshTokenRepository: jest.Mocked<RefreshTokenRepository>;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const mockRefreshTokenRepository: Partial<RefreshTokenRepository> = {
      save: jest.fn(),
      findByTokenHash: jest.fn(),
      revokeFamily: jest.fn(),
      revokeToken: jest.fn(),
    };

    const mockUserRepository: Partial<UserRepository> = {
      findById: jest.fn(),
    };

    const mockClock: Partial<Clock> = {
      now: jest.fn().mockReturnValue(new Date('2026-03-01T10:00:00Z')),
    };

    const mockJwtService: Partial<JwtService> = {
      sign: jest.fn().mockReturnValue('mock_access_token'),
    };

    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
        if (key === 'JWT_ACCESS_TTL_SECONDS') return 900;
        if (key === 'JWT_REFRESH_TTL_SECONDS') return 604800;
        if (key === 'JWT_ACCESS_SECRET') return 'secret-min-32-chars-long-secret-key';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenUseCase,
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: mockRefreshTokenRepository },
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: CLOCK, useValue: mockClock },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    useCase = module.get<RefreshTokenUseCase>(RefreshTokenUseCase);
    refreshTokenRepository = module.get(REFRESH_TOKEN_REPOSITORY);
    userRepository = module.get(USER_REPOSITORY);
  });

  it('should successfully rotate valid refresh token', async () => {
    const rawToken = 'raw_refresh_token';
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenEntity = new RefreshTokenEntity(
      'token-id-1',
      'user-1',
      'family-1',
      tokenHash,
      new Date('2026-03-08T10:00:00Z'),
      null,
      null,
      new Date('2026-03-01T10:00:00Z'),
    );

    const user = User.create('user-1', 'test@reserva.dev', 'hash', 'Test');

    refreshTokenRepository.findByTokenHash.mockResolvedValue(tokenEntity);
    userRepository.findById.mockResolvedValue(user);
    refreshTokenRepository.revokeToken.mockResolvedValue(undefined);
    refreshTokenRepository.save.mockResolvedValue(undefined);

    const result = await useCase.execute({ refreshToken: rawToken });

    expect(result.accessToken).toBe('mock_access_token');
    expect(result.refreshToken).toBeDefined();
    expect(refreshTokenRepository.revokeToken).toHaveBeenCalledWith(
      'token-id-1',
      expect.any(String),
    );
    expect(refreshTokenRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should throw TokenExpiredError if refresh token is expired', async () => {
    const rawToken = 'expired_token';
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenEntity = new RefreshTokenEntity(
      'token-id-1',
      'user-1',
      'family-1',
      tokenHash,
      new Date('2026-02-28T10:00:00Z'), // expired
      null,
      null,
      new Date('2026-02-21T10:00:00Z'),
    );

    refreshTokenRepository.findByTokenHash.mockResolvedValue(tokenEntity);

    await expect(useCase.execute({ refreshToken: rawToken })).rejects.toThrow(TokenExpiredError);
  });

  it('should detect reuse and revoke entire family if revoked token is reused', async () => {
    const rawToken = 'reused_token';
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenEntity = new RefreshTokenEntity(
      'token-id-1',
      'user-1',
      'family-1',
      tokenHash,
      new Date('2026-03-08T10:00:00Z'),
      new Date('2026-03-01T09:00:00Z'), // already revoked!
      'new-token-hash',
      new Date('2026-03-01T10:00:00Z'),
    );

    refreshTokenRepository.findByTokenHash.mockResolvedValue(tokenEntity);
    refreshTokenRepository.revokeFamily.mockResolvedValue(undefined);

    await expect(useCase.execute({ refreshToken: rawToken })).rejects.toThrow(
      RefreshTokenReusedError,
    );

    expect(refreshTokenRepository.revokeFamily).toHaveBeenCalledWith('family-1');
  });
});
