import { Module } from '@nestjs/common';
import { MindmapsController } from './mindmaps.controller';
import { MindmapsService } from './mindmaps.service';

@Module({
  controllers: [MindmapsController],
  providers: [MindmapsService],
  exports: [MindmapsService],
})
export class MindmapsModule {}
