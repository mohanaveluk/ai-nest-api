import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import * as fs from 'fs';
import { JWT } from 'google-auth-library';
import * as path from 'path';

@Injectable()
export class CloudStorageConfig {
  private readonly logger = new Logger(CloudStorageConfig.name);
  private storage: Storage;

  constructor(private configService: ConfigService) {}

  async initializeStorage1() {
    // Method 1: Use Workload Identity (Recommended)
    if (this.configService.get('NODE_ENV') === 'production') {
      this.storage = new Storage({
        projectId: this.configService.get('GOOGLE_CLOUD_PROJECT'),
      });
    } 
    // Method 2: Use Secret Manager for key file
    else if (this.configService.get('GCS_KEY_SECRET')) {
      const key = await this.getSecretKey();
      this.storage = new Storage({
        projectId: this.configService.get('GOOGLE_CLOUD_PROJECT'),
        credentials: key,
      });
    }
    // Method 3: Local development with key file
    else {
      this.storage = new Storage({
        keyFilename: this.configService.get('GCS_KEYFILE_PATH'),
        projectId: this.configService.get('GOOGLE_CLOUD_PROJECT'),
      });
    }

    return this.storage;
  }

  async initializeStorage(): Promise<Storage> {
    try {
      const env = this.configService.get('NODE_ENV');
      
      if (env === 'production') {
        this.logger.log('Initializing storage for production environment');
        await this.initializeForProduction();
      } else {
        this.logger.log('Initializing storage for development environment');
        await this.initializeForDevelopment();
      }

      // Test the connection
      await this.testStorageConnection();
      this.logger.log('Google Cloud Storage initialized successfully');
      
      return this.storage;
    } catch (error) {
      this.logger.error('Failed to initialize Google Cloud Storage:', error);
      throw error;
    }
  }

  private async initializeForProduction(): Promise<void> {
    // Try ADC (Application Default Credentials) first
    try {
      this.storage = new Storage();
      this.logger.log('Using Application Default Credentials');
      return;
    } catch (error) {
      this.logger.warn('ADC failed, trying service account key...');
    }

    // Fallback to service account key from environment
    await this.initializeWithServiceAccountKey();
  }

  private async initializeForDevelopment(): Promise<void> {
    const keyPath = this.configService.get('GCS_KEYFILE_PATH');
    
    if (!keyPath) {
      throw new Error('GCS_KEYFILE_PATH is required for development');
    }

    const resolvedKeyPath = path.resolve(process.cwd(), keyPath);
    
    if (!fs.existsSync(resolvedKeyPath)) {
      throw new Error(`Service account key file not found at: ${resolvedKeyPath}`);
    }

    try {
      const keyFileContent = fs.readFileSync(resolvedKeyPath, 'utf8');
      const keyFile = JSON.parse(keyFileContent);
      
      // CRITICAL: Fix the private key formatting
      const privateKey = keyFile.private_key;
      let formattedPrivateKey = privateKey;

      // Handle different newline formats
      if (privateKey.includes('\\n')) {
        formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
        this.logger.log('Fixed escaped newlines in private key');
      }

      // Ensure the key has proper headers
      if (!formattedPrivateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        throw new Error('Private key format is invalid - missing proper headers');
      }

      this.storage = new Storage({
        projectId: keyFile.project_id,
        credentials: {
          client_email: keyFile.client_email,
          private_key: formattedPrivateKey,
        },
      });

      // Validate and format the key properly
    //   const credentials = {
    //     client_email: keyFile.client_email,
    //     private_key: keyFile.private_key.replace(/\\n/g, '\n'), // Handle escaped newlines
    //   };

    //   this.storage = new Storage({
    //     projectId: keyFile.project_id || this.configService.get('GOOGLE_CLOUD_PROJECT'),
    //     credentials: credentials,
    //   });

      this.logger.log(`Using service account: ${keyFile.client_email}`);
    } catch (error) {
      this.logger.error('Failed to parse service account key file:', error);
      throw new Error(`Invalid service account key file: ${error.message}`);
    }
  }

  private async initializeWithServiceAccountKey(): Promise<void> {
    const privateKey = this.configService.get('GOOGLE_PRIVATE_KEY');
    const clientEmail = this.configService.get('GOOGLE_CLIENT_EMAIL');
    const projectId = this.configService.get('GOOGLE_CLOUD_PROJECT');

    if (!privateKey || !clientEmail) {
      throw new Error('GOOGLE_PRIVATE_KEY and GOOGLE_CLIENT_EMAIL are required for service account authentication');
    }

    try {
      // Format the private key properly
      const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

      // Create auth client with JWT
      const authClient = new JWT({
        email: clientEmail,
        key: formattedPrivateKey,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        projectId: projectId,
      });

      // Get access token to validate credentials
      await authClient.getAccessToken();

      this.storage = new Storage({
        projectId: projectId,
        authClient: authClient,
      });

      this.logger.log(`Using service account from env: ${clientEmail}`);
    } catch (error) {
      this.logger.error('Service account authentication failed:', error);
      throw new Error(`Service account authentication failed: ${error.message}`);
    }
  }

  private async testStorageConnection(): Promise<void> {
    try {
      const [buckets] = await this.storage.getBuckets();
      this.logger.log(`Successfully connected to Google Cloud Storage. Found ${buckets.length} buckets`);
    } catch (error) {
      this.logger.error('Storage connection test failed:', error);
      throw new Error(`Cannot connect to Google Cloud Storage: ${error.message}`);
    }
  }

  private async getSecretKey(): Promise<any> {
    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({
      name: `projects/${this.configService.get('GOOGLE_CLOUD_PROJECT')}/secrets/${this.configService.get('GCS_KEY_SECRET')}/versions/latest`,
    });
    
    const payload = version?.payload?.data?.toString();
    return JSON.parse(payload!);
  }

  getStorage(): Storage {
    if (!this.storage) {
      throw new Error('Storage not initialized. Call initializeStorage() first.');
    }
    return this.storage;
  }
}