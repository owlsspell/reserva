import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateResourceUseCase } from '../application/create-resource.use-case';
import { ListResourcesUseCase, ListResourcesQuery } from '../application/list-resources.use-case';
import { GetResourceUseCase } from '../application/get-resource.use-case';
import { UpdateScheduleUseCase } from '../application/update-schedule.use-case';
import { CreateBlackoutUseCase } from '../application/create-blackout.use-case';
import { RemoveBlackoutUseCase } from '../application/remove-blackout.use-case';
import { JwtAuthGuard } from '../../users/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../users/presentation/guards/roles.guard';
import { Roles } from '../../users/presentation/decorators/roles.decorator';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateBlackoutDto } from './dto/create-blackout.dto';
import { ResourceDetailsResponseDto } from './dto/resource-details-response.dto';

@ApiTags('resources')
@Controller('resources')
export class ResourcesController {
  constructor(
    private readonly createResource: CreateResourceUseCase,
    private readonly listResources: ListResourcesUseCase,
    private readonly getResource: GetResourceUseCase,
    private readonly updateSchedule: UpdateScheduleUseCase,
    private readonly createBlackout: CreateBlackoutUseCase,
    private readonly removeBlackout: RemoveBlackoutUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List resources with filters and cursor pagination' })
  async list(@Query() query: ListResourcesQuery) {
    return this.listResources.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get resource details including schedules and blackouts' })
  @ApiResponse({ status: 200, type: ResourceDetailsResponseDto })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async findOne(@Param('id') id: string) {
    return this.getResource.execute(id);
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

  @Put(':id/schedule')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Replace weekly schedule for a resource (Admin only)' })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async setSchedule(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    await this.updateSchedule.execute(id, dto.schedules);
    return { message: 'Schedule updated successfully' };
  }

  @Post(':id/blackouts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a blackout period for a resource (Admin only)' })
  @ApiResponse({ status: 201, description: 'Blackout added successfully' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async addBlackout(@Param('id') id: string, @Body() dto: CreateBlackoutDto) {
    const blackoutId = await this.createBlackout.execute({
      resourceId: id,
      startsAt: new Date(dto.startsAt),
      endsAt: new Date(dto.endsAt),
      reason: dto.reason,
    });
    return { id: blackoutId };
  }

  @Delete(':id/blackouts/:blackoutId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a blackout period (Admin only)' })
  @ApiResponse({ status: 200, description: 'Blackout removed successfully' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteBlackout(@Param('id') id: string, @Param('blackoutId') blackoutId: string) {
    await this.removeBlackout.execute(id, blackoutId);
    return { message: 'Blackout removed successfully' };
  }
}
