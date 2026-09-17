import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedModule } from './shared/shared.module';
import { InviteModule } from './invite/invite.module';
import { AdminModule } from './admin/admin.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        if (!uri) {
          throw new Error('Falta la variable MONGODB_URI');
        }

        return {
          uri,
          serverSelectionTimeoutMS: 15000,
          connectTimeoutMS: 15000,
        };
      },
      inject: [ConfigService],
    }),
    SharedModule,
    InviteModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
