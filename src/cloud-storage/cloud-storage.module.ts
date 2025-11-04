import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudStorageService } from '../services/cloud-storage.service';
import { CloudStorageConfig } from '../config/cloud-storage.config';

@Module({
  imports: [ConfigModule],
  providers: [CloudStorageConfig, CloudStorageService],
  exports: [CloudStorageService],
})
export class CloudStorageModule {}