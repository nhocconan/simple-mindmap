import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { LoggerService } from '../common/logger.service';
import {
  UpdateSettingsDto,
  AdminUserQueryDto,
  UpdateUserDto,
  CreateUserDto,
  LogsQueryDto,
  AdminMindmapQueryDto,
  UpdateMindmapDto,
} from './dto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private logger: LoggerService,
  ) {}

  // Settings Management
  async getSettings() {
    const settings = await this.prisma.setting.findMany();
    return settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, any>);
  }

  async updateSettings(dto: UpdateSettingsDto, adminId: string) {
    for (const [key, value] of Object.entries(dto)) {
      await this.prisma.setting.upsert({
        where: { key },
        update: { value: value as any },
        create: { key, value: value as any },
      });
    }

    await this.logger.log({
      action: 'UPDATE_SETTINGS',
      entity: 'Settings',
      userId: adminId,
      metadata: { keys: Object.keys(dto) },
    });

    return this.getSettings();
  }

  async getSetting(key: string) {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });
    return setting?.value || null;
  }

  // User Management
  async getUsers(query: AdminUserQueryDto) {
    const { page = 1, limit = 20, search, role, isActive, sort = 'createdAt', order = 'desc' } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          lastLogin: true,
          _count: {
            select: { mindmaps: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: { mindmaps: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async createUser(dto: CreateUserDto, adminId: string) {
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        isActive: dto.isActive ?? true,
        isVerified: true,
      },
    });

    await this.logger.log({
      action: 'ADMIN_CREATE_USER',
      entity: 'User',
      entityId: user.id,
      userId: adminId,
    });

    return this.getUser(user.id);
  }

  async updateUser(id: string, dto: UpdateUserDto, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      isActive: dto.isActive,
      isVerified: dto.isVerified,
    };

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 12);
    }

    await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    await this.logger.log({
      action: 'ADMIN_UPDATE_USER',
      entity: 'User',
      entityId: id,
      userId: adminId,
    });

    return this.getUser(id);
  }

  async deleteUser(id: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({ where: { id } });

    await this.logger.log({
      action: 'ADMIN_DELETE_USER',
      entity: 'User',
      entityId: id,
      userId: adminId,
    });

    return { message: 'User deleted successfully' };
  }

  // Logs Management
  async getLogs(query: LogsQueryDto) {
    return this.logger.getLogs({
      page: query.page,
      limit: query.limit,
      userId: query.userId,
      action: query.action,
      entity: query.entity,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });
  }

  // Mindmap Management
  async getMindmaps(query: AdminMindmapQueryDto) {
    const { page = 1, limit = 20, search, visibility, userId } = query;

    const where: any = {};

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    if (visibility) {
      where.visibility = visibility;
    }

    if (userId) {
      where.userId = userId;
    }

    const [mindmaps, total] = await Promise.all([
      this.prisma.mindmap.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.mindmap.count({ where }),
    ]);

    return {
      data: mindmaps,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMindmap(id: string) {
    const mindmap = await this.prisma.mindmap.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!mindmap) {
      throw new NotFoundException('Mindmap not found');
    }

    return mindmap;
  }

  async updateMindmap(id: string, dto: UpdateMindmapDto, adminId: string) {
    const mindmap = await this.prisma.mindmap.findUnique({ where: { id } });
    if (!mindmap) {
      throw new NotFoundException('Mindmap not found');
    }

    const updated = await this.prisma.mindmap.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        visibility: dto.visibility as any,
      },
    });

    await this.logger.log({
      action: 'ADMIN_UPDATE_MINDMAP',
      entity: 'Mindmap',
      entityId: id,
      userId: adminId,
    });

    return updated;
  }

  async deleteMindmap(id: string, adminId: string) {
    const mindmap = await this.prisma.mindmap.findUnique({ where: { id } });
    if (!mindmap) {
      throw new NotFoundException('Mindmap not found');
    }

    await this.prisma.mindmap.delete({ where: { id } });

    await this.logger.log({
      action: 'ADMIN_DELETE_MINDMAP',
      entity: 'Mindmap',
      entityId: id,
      userId: adminId,
    });

    return { message: 'Mindmap deleted successfully' };
  }

  // Cache Management
  async getCacheStats() {
    const keys = await this.redis.keys('*');
    return {
      totalKeys: keys.length,
      keys: keys.slice(0, 100), // Limit to first 100
    };
  }

  async clearCache(pattern?: string) {
    if (pattern) {
      const keys = await this.redis.keys(pattern);
      for (const key of keys) {
        await this.redis.del(key);
      }
      return { message: `Cleared ${keys.length} cache keys` };
    }

    await this.redis.flushAll();
    return { message: 'Cache cleared successfully' };
  }

  // Dashboard Stats
  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      totalMindmaps,
      publicMindmaps,
      recentUsers,
      recentLogs,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.mindmap.count(),
      this.prisma.mindmap.count({ where: { visibility: 'PUBLIC' } }),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
      }),
      this.prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { id: true, email: true, firstName: true } },
        },
      }),
    ]);

    return {
      stats: {
        totalUsers,
        activeUsers,
        totalMindmaps,
        publicMindmaps,
      },
      recentUsers,
      recentLogs,
    };
  }
}
