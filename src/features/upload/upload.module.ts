import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { UploadGateway } from './upload.gateway';
import { UploadUtilsService } from './upload-utils.service';
import { CloudStorageService } from 'src/services/cloud-storage.service';
import { CloudStorageConfig } from 'src/config/cloud-storage.config';
@Module({
  imports: [],
  controllers: [UploadController],
  providers: [UploadService, UploadUtilsService, UploadGateway, CloudStorageService, CloudStorageConfig],
  exports: [UploadService, UploadUtilsService, UploadGateway, CloudStorageService],
})
export class UploadModule {}