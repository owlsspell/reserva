import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { RESOURCE_REPOSITORY, ResourceRepository } from './resource.repository';

@Injectable()
export class RemoveBlackoutUseCase {
  constructor(@Inject(RESOURCE_REPOSITORY) private readonly repository: ResourceRepository) {}

  async execute(resourceId: string, blackoutId: string): Promise<void> {
    const resource = await this.repository.findById(resourceId);
    if (!resource || resource.archivedAt) {
      throw new NotFoundException('Resource not found');
    }
    await this.repository.removeBlackout(blackoutId);
  }
}
