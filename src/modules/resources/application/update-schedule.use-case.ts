import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { RESOURCE_REPOSITORY, ResourceRepository, ScheduleItem } from './resource.repository';

@Injectable()
export class UpdateScheduleUseCase {
  constructor(@Inject(RESOURCE_REPOSITORY) private readonly repository: ResourceRepository) {}

  async execute(resourceId: string, schedules: ScheduleItem[]): Promise<void> {
    const resource = await this.repository.findById(resourceId);
    if (!resource || resource.archivedAt) {
      throw new NotFoundException('Resource not found');
    }
    await this.repository.setSchedule(resourceId, schedules);
  }
}
