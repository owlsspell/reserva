import { Injectable, Inject } from '@nestjs/common';
import { Resource } from '../domain/resource';
import { RESOURCE_REPOSITORY, ResourceRepository } from './resource.repository';

export interface CreateResourceCommand {
  name: string;
  description: string;
  type: string;
  capacity: number;
  city: string;
  timezone: string;
  pricePerHour: number;
}

@Injectable()
export class CreateResourceUseCase {
  constructor(@Inject(RESOURCE_REPOSITORY) private readonly repository: ResourceRepository) {}

  async execute(cmd: CreateResourceCommand): Promise<string> {
    const resource = Resource.create(cmd);
    await this.repository.save(resource);
    return resource.id;
  }
}
