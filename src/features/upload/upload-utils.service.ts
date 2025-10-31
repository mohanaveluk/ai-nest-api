import { Injectable, Logger } from '@nestjs/common';
import { FileTypeValidator } from './utils/file-validator';
import { VirusScanner } from './utils/virus-scanner';
import { AuditLogger } from './utils/audit-logger';
import { RetryHandler } from './utils/retry-handler';

@Injectable()
export class UploadUtilsService {
  private readonly logger = new Logger(UploadUtilsService.name);

  /**
   * Validates file type and size
   */
  validateFile(file: Express.Multer.File): void {
    try {
      FileTypeValidator.validate(file);
    } catch (error) {
      this.logger.error(`File validation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Scans file for viruses
   */
  async scanFile(file: Express.Multer.File): Promise<void> {
    const isClean = await VirusScanner.scan(file.buffer);
    if (!isClean) {
      this.logger.warn(`Virus detected in file: ${file.originalname}`);
      throw new Error('Virus detected in file');
    }
  }

  /**
   * Logs audit events
   */
  logAudit(event: string): void {
    AuditLogger.log(event);
    this.logger.log(`Audit: ${event}`);
  }

  /**
   * Executes an operation with retry logic
   */
  async executeWithRetry<T>(operation: () => Promise<T>, maxAttempts = 3): Promise<T> {
    return await RetryHandler.retry(operation, maxAttempts);
  }
}
