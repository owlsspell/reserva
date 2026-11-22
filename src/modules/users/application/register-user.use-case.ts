import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, UserRepository } from '../application/ports/user.repository';
import { PASSWORD_HASHER, PasswordHasher } from '../application/ports/password-hasher';
import { User } from '../domain/user.entity';
import { EmailTakenError } from '../domain/email-taken.error';

export interface RegisterUserCommand {
  email: string;
  password: string;
  name: string;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(command: RegisterUserCommand): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(command.email);
    if (existingUser) {
      throw new EmailTakenError(command.email);
    }

    const passwordHash = await this.passwordHasher.hash(command.password);
    const userId = crypto.randomUUID();
    const user = User.create(userId, command.email, passwordHash, command.name);

    await this.userRepository.save(user);
    return user;
  }
}
