import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { RESOURCE_REPOSITORY, ResourceRepository } from './resource.repository';

export interface CreateBlackoutCommand {
  resourceId: string;
  startsAt: Date;
  endsAt: Date;
  reason: string;
}

@Injectable()
export class CreateBlackoutUseCase {
  constructor(@Inject(RESOURCE_REPOSITORY) private readonly repository: ResourceRepository) {}

  async execute(cmd: CreateBlackoutCommand): Promise<string> {
    const resource = await this.repository.findById(cmd.resourceId);
    if (!resource || resource.archivedAt) {
      throw new NotFoundException('Resource not found');
    }
    return this.repository.addBlackout(cmd.resourceId, cmd.startsAt, cmd.endsAt, cmd.reason);
  }
}
