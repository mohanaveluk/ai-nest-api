import { Inject, Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { ConfigService } from '@nestjs/config';

import { PassThrough } from 'stream';
import { UploadResponseDto } from './dto/upload.dto';

import { UploadGateway } from './upload.gateway';
import { AuditLogger } from './utils/audit-logger';
import { FileTypeValidator } from './utils/file-validator';
import { VirusScanner } from './utils/virus-scanner';
import { RetryHandler } from './utils/retry-handler';
import { UploadUtilsService } from './upload-utils.service';

@Injectable()
export class UploadService {
  

  private storage = new Storage(
    {
      keyFilename: process.env.GCS_KEYFILE_PATH,// path.join(__dirname, "../api-node-docker-4d09c33e8fdb.json"),
      projectId: process.env.GCS_PROJECT_ID || 'starinvoice',
    }
  );
  private bucket = this.storage.bucket(process.env.GCS_BUCKET_NAME || 'bank-ai-documents');
  // .setMetadata({
  //   //cacheControl: 'public, max-age=31536000',
  //   iamConfiguration: {
  //     uniformBucketLevelAccess: {
  //       enabled: true,
  //     },
  //   },
  // });

  constructor(
    //@Inject(UploadGateway)
    private readonly uploadUtils: UploadUtilsService,
    private readonly uploadGateway: UploadGateway,
    private configService: ConfigService
  ) {}

  async uploadFile(file: Express.Multer.File): Promise<any> {
    try {
      FileTypeValidator.validate(file);
      await this.uploadUtils.scanFile(file);
      //const isClean = await this.uploadUtils.scanFile(file);
      this.uploadUtils.logAudit(`Starting upload for ${file.originalname}`);

      const uploadOperation = () => {
        return new Promise((resolve, reject) => {
          const blob = this.bucket.file(file.originalname);
          const blobStream = blob.createWriteStream({
            resumable: true,
            contentType: file.mimetype,
          });

          // Use a PassThrough so we can listen for 'data' events and track progress
          const passThrough = new PassThrough();

          let uploadedBytes = 0;
          const totalBytes = file.size;

          passThrough.on('data', (chunk: Buffer) => {
            uploadedBytes += chunk.length;
            console.log(`Uploaded ${uploadedBytes} of ${totalBytes} bytes`);
            const progress = Math.round((uploadedBytes / totalBytes) * 100);
            this.uploadGateway.emitProgress(file.originalname, progress);
          });

          blobStream.on('finish', () => {
            this.uploadGateway.emitProgress(file.originalname, 100);
            AuditLogger.log(`Upload completed for ${file.originalname}`);
            resolve({ status: 'Uploaded', fileName: file.originalname });
          });

          blobStream.on('error', (err) => {
            this.uploadGateway.emitProgress(file.originalname, 0);
            AuditLogger.log(`Upload failed for ${file.originalname}: ${err.message}`);
            reject({ status: 'Failed', error: err.message });
          });

          passThrough.on('error', (err) => {
            // If PassThrough errors, propagate to blobStream
            blobStream.destroy(err);
          });

          // Start piping the in-memory buffer through PassThrough into the GCS write stream.
          passThrough.end(file.buffer);
          passThrough.pipe(blobStream);
        });
      };

      return await RetryHandler.retry(uploadOperation, 3);
    } catch (error) {
      AuditLogger.log(`Upload failed for ${file.originalname}: ${error.message}`);
      this.uploadGateway.emitProgress(file.originalname, 0);
      return { status: 'Failed', error: error.message };
    }
  }

}