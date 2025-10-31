import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UploadModule } from './features/upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      //load: [databaseConfig, jwtConfig, adminConfig, googleCloudConfig, smtpConfig],
      isGlobal: true,
    }),
    UploadModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
