import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, UserRepository } from './ports/user.repository';
import { User } from '../domain/user.entity';
import { UnauthenticatedError } from '../domain/auth-errors';

export interface GetMeCommand {
  userId: string;
}

@Injectable()
export class GetMeUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: UserRepository) {}

  async execute(command: GetMeCommand): Promise<User> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UnauthenticatedError('User not found');
    }
    return user;
  }
}
