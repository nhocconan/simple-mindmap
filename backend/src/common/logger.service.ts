import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export interface LogEntry {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class LoggerService {
  constructor(private prisma: PrismaService) {}

  async log(entry: LogEntry): Promise<void> {
    await this.prisma.activityLog.create({
      data: {
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        userId: entry.userId,
        metadata: entry.metadata,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  }

  async getLogs(options: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    entity?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { page = 1, limit = 50, userId, action, entity, startDate, endDate } = options;

    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
