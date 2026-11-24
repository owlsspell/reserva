import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateResourceUseCase } from '../application/create-resource.use-case';
import { ListResourcesUseCase, ListResourcesQuery } from '../application/list-resources.use-case';
import { JwtAuthGuard } from '../../users/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../users/presentation/guards/roles.guard';
import { Roles } from '../../users/presentation/decorators/roles.decorator';
import { CreateResourceDto } from './dto/create-resource.dto';

@ApiTags('resources')
@Controller('resources')
export class ResourcesController {
  constructor(
    private readonly createResource: CreateResourceUseCase,
    private readonly listResources: ListResourcesUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List resources with filters and cursor pagination' })
  async list(@Query() query: ListResourcesQuery) {
    return this.listResources.execute(query);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a resource (Admin only)' })
  @ApiResponse({ status: 201, description: 'Resource created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (admin role required)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() dto: CreateResourceDto) {
    const id = await this.createResource.execute(dto);
    return { id };
  }
}
