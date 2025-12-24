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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { MindmapsService } from './mindmaps.service';
import { CreateMindmapDto, UpdateMindmapDto, ShareMindmapDto, MindmapQueryDto } from './dto';

@ApiTags('mindmaps')
@Controller('mindmaps')
export class MindmapsController {
  constructor(private mindmapsService: MindmapsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new mindmap' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateMindmapDto) {
    return this.mindmapsService.create(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all user mindmaps' })
  async findAll(@CurrentUser('id') userId: string, @Query() query: MindmapQueryDto) {
    return this.mindmapsService.findAll(userId, query);
  }

  @Get('shared-with-me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get mindmaps shared with me' })
  async getSharedWithMe(@CurrentUser('id') userId: string, @Query() query: MindmapQueryDto) {
    return this.mindmapsService.getSharedWithMe(userId, query);
  }

  @Get('public')
  @ApiOperation({ summary: 'Get public mindmaps' })
  async getPublic(@Query() query: MindmapQueryDto) {
    return this.mindmapsService.getPublicMindmaps(query);
  }

  @Get('shared/:shareToken')
  @ApiOperation({ summary: 'Get a mindmap by share token' })
  async getByShareToken(@Param('shareToken') shareToken: string) {
    return this.mindmapsService.getByShareToken(shareToken);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a mindmap by ID' })
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.mindmapsService.findOne(id, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a mindmap' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMindmapDto,
  ) {
    return this.mindmapsService.update(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a mindmap' })
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.mindmapsService.delete(id, userId);
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle favorite status' })
  async toggleFavorite(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.mindmapsService.toggleFavorite(id, userId);
  }

  @Post(':id/archive')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle archive status' })
  async toggleArchive(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.mindmapsService.toggleArchive(id, userId);
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Share mindmap with a user' })
  async share(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ShareMindmapDto,
  ) {
    return this.mindmapsService.share(id, userId, dto);
  }

  @Post(':id/share-link')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a public share link' })
  async generateShareLink(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.mindmapsService.generateShareLink(id, userId);
  }

  @Delete(':id/share/:shareUserId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove share from a user' })
  async removeShare(
    @Param('id') id: string,
    @Param('shareUserId') shareUserId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.mindmapsService.removeShare(id, userId, shareUserId);
  }

  @Post(':id/duplicate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Duplicate a mindmap' })
  async duplicate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.mindmapsService.duplicate(id, userId);
  }
}
