import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { UploadGateway } from './upload.gateway';
import { UploadUtilsService } from './upload-utils.service';
@Module({
  imports: [],
  controllers: [UploadController],
  providers: [UploadService, UploadUtilsService, UploadGateway],
  exports: [UploadService, UploadUtilsService, UploadGateway],
})
export class UploadModule {}