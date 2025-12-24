import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MindmapVisibility, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { LoggerService } from '../common/logger.service';
import { CreateMindmapDto, UpdateMindmapDto, ShareMindmapDto, MindmapQueryDto } from './dto';

@Injectable()
export class MindmapsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private logger: LoggerService,
  ) {}

  async create(userId: string, dto: CreateMindmapDto) {
    const mindmap = await this.prisma.mindmap.create({
      data: {
        title: dto.title,
        description: dto.description,
        data: dto.data || {},
        visibility: dto.visibility || MindmapVisibility.PRIVATE,
        userId,
      },
    });

    await this.logger.log({
      action: 'CREATE_MINDMAP',
      entity: 'Mindmap',
      entityId: mindmap.id,
      userId,
    });

    return mindmap;
  }

  async findAll(userId: string, query: MindmapQueryDto) {
    const { page = 1, limit = 20, search, visibility, isFavorite, isArchived, sort = 'updatedAt', order = 'desc' } = query;

    const where: Prisma.MindmapWhereInput = {
      userId,
      isArchived: isArchived ?? false,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (visibility) {
      where.visibility = visibility;
    }

    if (isFavorite !== undefined) {
      where.isFavorite = isFavorite;
    }

    const [mindmaps, total] = await Promise.all([
      this.prisma.mindmap.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          visibility: true,
          isFavorite: true,
          isArchived: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.mindmap.count({ where }),
    ]);

    return {
      data: mindmaps,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    // Check cache first
    const cached = await this.redis.getJson<any>(`mindmap:${id}`);
    if (cached && (cached.userId === userId || cached.visibility === 'PUBLIC')) {
      return cached;
    }

    const mindmap = await this.prisma.mindmap.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        shares: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!mindmap) {
      throw new NotFoundException('Mindmap not found');
    }

    // Check access
    const isOwner = mindmap.userId === userId;
    const isShared = mindmap.shares.some((s) => s.userId === userId);
    const isPublic = mindmap.visibility === MindmapVisibility.PUBLIC;

    if (!isOwner && !isShared && !isPublic) {
      throw new ForbiddenException('Access denied');
    }

    // Cache for 5 minutes
    await this.redis.setJson(`mindmap:${id}`, mindmap, 300);

    return mindmap;
  }

  async update(id: string, userId: string, dto: UpdateMindmapDto) {
    const mindmap = await this.findOwnedMindmap(id, userId);

    const updated = await this.prisma.mindmap.update({
      where: { id: mindmap.id },
      data: {
        title: dto.title,
        description: dto.description,
        data: dto.data,
        thumbnail: dto.thumbnail,
        visibility: dto.visibility,
        isFavorite: dto.isFavorite,
        isArchived: dto.isArchived,
      },
    });

    // Invalidate cache
    await this.redis.del(`mindmap:${id}`);

    await this.logger.log({
      action: 'UPDATE_MINDMAP',
      entity: 'Mindmap',
      entityId: id,
      userId,
    });

    return updated;
  }

  async delete(id: string, userId: string) {
    const mindmap = await this.findOwnedMindmap(id, userId);

    await this.prisma.mindmap.delete({
      where: { id: mindmap.id },
    });

    // Invalidate cache
    await this.redis.del(`mindmap:${id}`);

    await this.logger.log({
      action: 'DELETE_MINDMAP',
      entity: 'Mindmap',
      entityId: id,
      userId,
    });

    return { message: 'Mindmap deleted successfully' };
  }

  async toggleFavorite(id: string, userId: string) {
    const mindmap = await this.findOwnedMindmap(id, userId);

    const updated = await this.prisma.mindmap.update({
      where: { id: mindmap.id },
      data: { isFavorite: !mindmap.isFavorite },
    });

    await this.redis.del(`mindmap:${id}`);

    return updated;
  }

  async toggleArchive(id: string, userId: string) {
    const mindmap = await this.findOwnedMindmap(id, userId);

    const updated = await this.prisma.mindmap.update({
      where: { id: mindmap.id },
      data: { isArchived: !mindmap.isArchived },
    });

    await this.redis.del(`mindmap:${id}`);

    return updated;
  }

  async share(id: string, userId: string, dto: ShareMindmapDto) {
    const mindmap = await this.findOwnedMindmap(id, userId);

    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (targetUser.id === userId) {
      throw new ForbiddenException('Cannot share with yourself');
    }

    const share = await this.prisma.mindmapShare.upsert({
      where: {
        mindmapId_userId: { mindmapId: id, userId: targetUser.id },
      },
      update: { canEdit: dto.canEdit ?? false },
      create: {
        mindmapId: id,
        userId: targetUser.id,
        canEdit: dto.canEdit ?? false,
      },
    });

    await this.prisma.mindmap.update({
      where: { id },
      data: { visibility: MindmapVisibility.SHARED },
    });

    await this.redis.del(`mindmap:${id}`);

    await this.logger.log({
      action: 'SHARE_MINDMAP',
      entity: 'Mindmap',
      entityId: id,
      userId,
      metadata: { sharedWith: targetUser.email },
    });

    return share;
  }

  async removeShare(id: string, userId: string, shareUserId: string) {
    await this.findOwnedMindmap(id, userId);

    await this.prisma.mindmapShare.delete({
      where: {
        mindmapId_userId: { mindmapId: id, userId: shareUserId },
      },
    });

    // Check if any shares left
    const sharesCount = await this.prisma.mindmapShare.count({
      where: { mindmapId: id },
    });

    if (sharesCount === 0) {
      await this.prisma.mindmap.update({
        where: { id },
        data: { visibility: MindmapVisibility.PRIVATE },
      });
    }

    await this.redis.del(`mindmap:${id}`);

    return { message: 'Share removed successfully' };
  }

  async getSharedWithMe(userId: string, query: MindmapQueryDto) {
    const { page = 1, limit = 20 } = query;

    const [shares, total] = await Promise.all([
      this.prisma.mindmapShare.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          mindmap: {
            select: {
              id: true,
              title: true,
              description: true,
              thumbnail: true,
              updatedAt: true,
              user: {
                select: { id: true, email: true, firstName: true, lastName: true },
              },
            },
          },
        },
      }),
      this.prisma.mindmapShare.count({ where: { userId } }),
    ]);

    return {
      data: shares.map((s) => ({ ...s.mindmap, canEdit: s.canEdit })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPublicMindmaps(query: MindmapQueryDto) {
    const { page = 1, limit = 20, search } = query;

    const where: Prisma.MindmapWhereInput = {
      visibility: MindmapVisibility.PUBLIC,
      isArchived: false,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [mindmaps, total] = await Promise.all([
      this.prisma.mindmap.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          updatedAt: true,
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.mindmap.count({ where }),
    ]);

    return {
      data: mindmaps,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async duplicate(id: string, userId: string) {
    const mindmap = await this.findOne(id, userId);

    const duplicated = await this.prisma.mindmap.create({
      data: {
        title: `${mindmap.title} (Copy)`,
        description: mindmap.description,
        data: mindmap.data as any,
        visibility: MindmapVisibility.PRIVATE,
        userId,
      },
    });

    await this.logger.log({
      action: 'DUPLICATE_MINDMAP',
      entity: 'Mindmap',
      entityId: duplicated.id,
      userId,
      metadata: { originalId: id },
    });

    return duplicated;
  }

  async generateShareLink(id: string, userId: string) {
    const mindmap = await this.findOwnedMindmap(id, userId);

    // Generate a unique share token if not exists
    let shareToken = mindmap.shareToken;
    if (!shareToken) {
      shareToken = randomBytes(16).toString('hex');
      await this.prisma.mindmap.update({
        where: { id },
        data: { shareToken },
      });
    }

    await this.logger.log({
      action: 'GENERATE_SHARE_LINK',
      entity: 'Mindmap',
      entityId: id,
      userId,
    });

    return { shareToken };
  }

  async getByShareToken(shareToken: string) {
    const mindmap = await this.prisma.mindmap.findFirst({
      where: { shareToken },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!mindmap) {
      throw new NotFoundException('Mindmap not found or link expired');
    }

    return {
      id: mindmap.id,
      title: mindmap.title,
      description: mindmap.description,
      data: mindmap.data,
      thumbnail: mindmap.thumbnail,
      createdAt: mindmap.createdAt,
      updatedAt: mindmap.updatedAt,
      user: mindmap.user,
    };
  }

  private async findOwnedMindmap(id: string, userId: string) {
    const mindmap = await this.prisma.mindmap.findUnique({
      where: { id },
    });

    if (!mindmap) {
      throw new NotFoundException('Mindmap not found');
    }

    if (mindmap.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return mindmap;
  }
}
