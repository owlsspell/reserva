import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginUserUseCase } from './login-user.use-case';
import { USER_REPOSITORY, UserRepository } from './ports/user.repository';
import { PASSWORD_HASHER, PasswordHasher } from './ports/password-hasher';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from './ports/refresh-token.repository';
import { CLOCK, Clock } from '../../../common/time/clock';
import { UnauthenticatedError } from '../domain/auth-errors';
import { User } from '../domain/user.entity';

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase;
  let userRepository: jest.Mocked<UserRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let refreshTokenRepository: jest.Mocked<RefreshTokenRepository>;

  beforeEach(async () => {
    const mockUserRepository: Partial<UserRepository> = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    const mockPasswordHasher: Partial<PasswordHasher> = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    const mockRefreshTokenRepository: Partial<RefreshTokenRepository> = {
      save: jest.fn(),
      findByTokenHash: jest.fn(),
      revokeFamily: jest.fn(),
      revokeToken: jest.fn(),
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
        LoginUserUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: PASSWORD_HASHER, useValue: mockPasswordHasher },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: mockRefreshTokenRepository },
        { provide: CLOCK, useValue: mockClock },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    useCase = module.get<LoginUserUseCase>(LoginUserUseCase);
    userRepository = module.get(USER_REPOSITORY);
    passwordHasher = module.get(PASSWORD_HASHER);
    refreshTokenRepository = module.get(REFRESH_TOKEN_REPOSITORY);
  });

  it('should successfully login user and return tokens', async () => {
    const user = User.create('user-1', 'test@reserva.dev', 'hashed_pass', 'Test');
    userRepository.findByEmail.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(true);
    refreshTokenRepository.save.mockResolvedValue(undefined);

    const result = await useCase.execute({
      email: 'test@reserva.dev',
      password: 'password123',
    });

    expect(result.user).toEqual(user);
    expect(result.tokens.accessToken).toBe('mock_access_token');
    expect(result.tokens.refreshToken).toBeDefined();
    expect(refreshTokenRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should throw UnauthenticatedError if user not found', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        email: 'wrong@reserva.dev',
        password: 'password123',
      }),
    ).rejects.toThrow(UnauthenticatedError);
  });

  it('should throw UnauthenticatedError if password is invalid', async () => {
    const user = User.create('user-1', 'test@reserva.dev', 'hashed_pass', 'Test');
    userRepository.findByEmail.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({
        email: 'test@reserva.dev',
        password: 'wrongpassword',
      }),
    ).rejects.toThrow(UnauthenticatedError);
  });
});
