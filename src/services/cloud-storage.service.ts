import { Injectable, OnModuleInit } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { CloudStorageConfig } from '../config/cloud-storage.config';

@Injectable()
export class CloudStorageService implements OnModuleInit {
  private storage: Storage;
  private bucketName: string;

  constructor(private cloudStorageConfig: CloudStorageConfig) {
    this.bucketName = process.env.GCS_BUCKET_NAME || 'bank-ai-documents';
  }

  async onModuleInit() {
    this.storage = await this.cloudStorageConfig.initializeStorage();
  }

  async uploadFile(file: Buffer, filename: string): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const fileRef = bucket.file(filename);

    await fileRef.save(file);
    
    // Make file publicly accessible (optional)
    //await fileRef.makePublic();
    
    return `https://storage.googleapis.com/${this.bucketName}/${filename}`;
  }

  async downloadFile(filename: string): Promise<Buffer> {
    const bucket = this.storage.bucket(this.bucketName);
    const fileRef = bucket.file(filename);
    
    const [fileBuffer] = await fileRef.download();
    return fileBuffer;
  }

  async deleteFile(filename: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    const fileRef = bucket.file(filename);
    
    await fileRef.delete();
  }

  async listFiles(prefix?: string): Promise<string[]> {
    const bucket = this.storage.bucket(this.bucketName);
    const [files] = await bucket.getFiles({ prefix });
    
    return files.map(file => file.name);
  }
}