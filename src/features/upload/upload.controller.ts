
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  HttpException,
  HttpStatus,
  Get,
  Delete,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { ApiConsumes, ApiBody, ApiTags } from '@nestjs/swagger';
import { CloudStorageService } from 'src/services/cloud-storage.service';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService,
    private readonly cloudStorageService: CloudStorageService
  ) {}

  @Post('doc')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.uploadService.uploadFile(file);
    } catch (error) {
      throw new HttpException('Upload failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const fileUrl = await this.cloudStorageService.uploadFile(
      file.buffer,
      file.originalname
    );
    return { url: fileUrl };
  }

  @Get('list')
  async listFiles() {
    const files = await this.cloudStorageService.listFiles();
    return { files };
  }

  @Delete(':filename')
  async deleteFile(@Param('filename') filename: string) {
    await this.cloudStorageService.deleteFile(filename);
    return { message: 'File deleted successfully' };
  }
  
}
