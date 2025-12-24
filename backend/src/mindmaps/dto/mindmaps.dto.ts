import { IsString, IsOptional, IsBoolean, IsEnum, IsObject, IsNumber, Min, Max, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { MindmapVisibility } from '@prisma/client';

export class CreateMindmapDto {
  @ApiProperty({ example: 'My First Mindmap' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'A description of my mindmap' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ enum: MindmapVisibility })
  @IsOptional()
  @IsEnum(MindmapVisibility)
  visibility?: MindmapVisibility;
}

export class UpdateMindmapDto {
  @ApiPropertyOptional({ example: 'Updated Title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional({ enum: MindmapVisibility })
  @IsOptional()
  @IsEnum(MindmapVisibility)
  visibility?: MindmapVisibility;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}

export class ShareMindmapDto {
  @ApiProperty({ example: 'friend@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  canEdit?: boolean;
}

export class MindmapQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: MindmapVisibility })
  @IsOptional()
  @IsEnum(MindmapVisibility)
  visibility?: MindmapVisibility;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isFavorite?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isArchived?: boolean;

  @ApiPropertyOptional({ enum: ['createdAt', 'updatedAt', 'title'] })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc';
}
