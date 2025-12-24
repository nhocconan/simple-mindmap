import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MindmapsModule } from './mindmaps/mindmaps.module';
import { AdminModule } from './admin/admin.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    CommonModule,
    AuthModule,
    UsersModule,
    MindmapsModule,
    AdminModule,
  ],
})
export class AppModule {}
