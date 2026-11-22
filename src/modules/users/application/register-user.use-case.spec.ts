import { Test, TestingModule } from '@nestjs/testing';
import { RegisterUserUseCase } from './register-user.use-case';
import { USER_REPOSITORY, UserRepository } from './ports/user.repository';
import { PASSWORD_HASHER, PasswordHasher } from './ports/password-hasher';
import { EmailTakenError } from '../domain/email-taken.error';
import { User } from '../domain/user.entity';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let userRepository: jest.Mocked<UserRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;

  beforeEach(async () => {
    const mockUserRepository: Partial<UserRepository> = {
      findByEmail: jest.fn(),
      save: jest.fn(),
    };

    const mockPasswordHasher: Partial<PasswordHasher> = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUserUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: PASSWORD_HASHER, useValue: mockPasswordHasher },
      ],
    }).compile();

    useCase = module.get<RegisterUserUseCase>(RegisterUserUseCase);
    userRepository = module.get(USER_REPOSITORY);
    passwordHasher = module.get(PASSWORD_HASHER);
  });

  it('should successfully register a new user', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('hashed_password');

    const result = await useCase.execute({
      email: 'test@reserva.dev',
      password: 'password123',
      name: 'Test User',
    });

    expect(result).toBeInstanceOf(User);
    expect(result.email).toBe('test@reserva.dev');
    expect(result.passwordHash).toBe('hashed_password');
    expect(userRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should throw EmailTakenError if email already exists', async () => {
    const existingUser = User.create('1', 'test@reserva.dev', 'hash', 'Existing');
    userRepository.findByEmail.mockResolvedValue(existingUser);

    await expect(
      useCase.execute({
        email: 'test@reserva.dev',
        password: 'password123',
        name: 'Test User',
      }),
    ).rejects.toThrow(EmailTakenError);

    expect(userRepository.save).not.toHaveBeenCalled();
  });
});
