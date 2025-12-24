import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis.service';
import { MailService } from './mail.service';
import { LoggerService } from './logger.service';

@Global()
@Module({
  providers: [PrismaService, RedisService, MailService, LoggerService],
  exports: [PrismaService, RedisService, MailService, LoggerService],
})
export class CommonModule {}
