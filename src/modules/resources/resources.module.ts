import { Module } from '@nestjs/common';
import { PrismaResourceRepository } from './infrastructure/prisma-resource.repository';
import { RESOURCE_REPOSITORY } from './application/resource.repository';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateResourceUseCase } from './application/create-resource.use-case';
import { ListResourcesUseCase } from './application/list-resources.use-case';
import { ResourcesController } from './presentation/resources.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [ResourcesController],
  providers: [
    PrismaService,
    { provide: RESOURCE_REPOSITORY, useClass: PrismaResourceRepository },
    CreateResourceUseCase,
    ListResourcesUseCase,
  ],
  exports: [RESOURCE_REPOSITORY],
})
export class ResourcesModule {}
