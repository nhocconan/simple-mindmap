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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { AdminService } from './admin.service';
import {
  UpdateSettingsDto,
  AdminUserQueryDto,
  UpdateUserDto,
  CreateUserDto,
  LogsQueryDto,
  ClearCacheDto,
  AdminMindmapQueryDto,
  UpdateMindmapDto,
} from './dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  // Dashboard
  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  // Settings
  @Get('settings')
  @ApiOperation({ summary: 'Get all settings' })
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update settings' })
  async updateSettings(@Body() dto: UpdateSettingsDto, @CurrentUser('id') adminId: string) {
    return this.adminService.updateSettings(dto, adminId);
  }

  @Get('settings/:key')
  @ApiOperation({ summary: 'Get a specific setting' })
  async getSetting(@Param('key') key: string) {
    return this.adminService.getSetting(key);
  }

  // Users
  @Get('users')
  @ApiOperation({ summary: 'Get all users with pagination' })
  async getUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Post('users')
  @ApiOperation({ summary: 'Create a new user' })
  async createUser(@Body() dto: CreateUserDto, @CurrentUser('id') adminId: string) {
    return this.adminService.createUser(dto, adminId);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get a user by ID' })
  async getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update a user' })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.updateUser(id, dto, adminId);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user' })
  async deleteUser(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.adminService.deleteUser(id, adminId);
  }

  // Mindmaps
  @Get('mindmaps')
  @ApiOperation({ summary: 'Get all mindmaps with pagination' })
  async getMindmaps(@Query() query: AdminMindmapQueryDto) {
    return this.adminService.getMindmaps(query);
  }

  @Get('mindmaps/:id')
  @ApiOperation({ summary: 'Get a mindmap by ID' })
  async getMindmap(@Param('id') id: string) {
    return this.adminService.getMindmap(id);
  }

  @Put('mindmaps/:id')
  @ApiOperation({ summary: 'Update a mindmap' })
  async updateMindmap(
    @Param('id') id: string,
    @Body() dto: UpdateMindmapDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.updateMindmap(id, dto, adminId);
  }

  @Delete('mindmaps/:id')
  @ApiOperation({ summary: 'Delete a mindmap' })
  async deleteMindmap(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.adminService.deleteMindmap(id, adminId);
  }

  // Logs
  @Get('logs')
  @ApiOperation({ summary: 'Get activity logs' })
  async getLogs(@Query() query: LogsQueryDto) {
    return this.adminService.getLogs(query);
  }

  // Cache
  @Get('cache')
  @ApiOperation({ summary: 'Get cache statistics' })
  async getCacheStats() {
    return this.adminService.getCacheStats();
  }

  @Post('cache/clear')
  @ApiOperation({ summary: 'Clear cache' })
  async clearCache(@Body() dto: ClearCacheDto) {
    return this.adminService.clearCache(dto.pattern);
  }
}
