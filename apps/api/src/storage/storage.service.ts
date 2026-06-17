import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private readonly localDir: string;
  private readonly signingSecret: string;
  private readonly apiBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');
    const region = this.config.get<string>('AWS_REGION', 'us-east-1');
    const storageType = this.config.get<string>('STORAGE_TYPE', 'local');
    this.bucketName = this.config.get<string>('AWS_S3_BUCKET', '');
    this.signingSecret = this.config.get<string>('JWT_SECRET', 'local-secret-for-storage-signing');
    this.apiBaseUrl = this.config.get<string>('API_BASE_URL', 'http://localhost:3001');
    this.localDir = path.resolve(process.cwd(), 'uploads');

    if (storageType === 's3' && accessKeyId && secretAccessKey && this.bucketName) {
      this.s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log('S3 Storage Engine initialized');
    } else {
      this.logger.warn('Using Local Storage Engine. Files will be saved to ./uploads');
      if (!fs.existsSync(this.localDir)) {
        fs.mkdirSync(this.localDir, { recursive: true });
      }
      this.logger.log(`Local Storage Engine initialized at: ${this.localDir}`);
    }
  }

  /**
   * Upload file buffer to active storage engine (S3 or Local)
   */
  async uploadFile(
    file: { buffer: Buffer; originalname: string; mimetype: string },
    folder: string,
  ): Promise<{ fileUrl: string; fileKey: string }> {
    // Basic file validation
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'application/msword', // doc
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Only PDF and Word docs are allowed.`,
      );
    }

    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.buffer.length > maxFileSize) {
      throw new BadRequestException('File is too large. Max allowed size is 10MB.');
    }

    const extension = path.extname(file.originalname);
    const safeBaseName = path.basename(file.originalname, extension).replace(/[^a-zA-Z0-9]/g, '_');
    const fileKey = `${folder}/${crypto.randomUUID()}_${safeBaseName}${extension}`;

    if (this.s3Client) {
      try {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
          ServerSideEncryption: 'aws:kms',
        });
        await this.s3Client.send(command);
        const fileUrl = await this.getSignedUrl(fileKey);
        return { fileUrl, fileKey };
      } catch (err) {
        this.logger.error('Failed to upload file to S3', err);
        throw new InternalServerErrorException('Error uploading file to remote storage');
      }
    } else {
      try {
        const destPath = path.join(this.localDir, fileKey);
        const destFolder = path.dirname(destPath);
        if (!fs.existsSync(destFolder)) {
          fs.mkdirSync(destFolder, { recursive: true });
        }
        await fs.promises.writeFile(destPath, file.buffer);
        const fileUrl = await this.getSignedUrl(fileKey);
        return { fileUrl, fileKey };
      } catch (err) {
        this.logger.error('Failed to write file to local disk', err);
        throw new InternalServerErrorException('Error saving file locally');
      }
    }
  }

  /**
   * Generate a signed GET URL for downloading files
   */
  async getSignedUrl(fileKey: string, expirySeconds = 86400): Promise<string> {
    if (this.s3Client) {
      try {
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: fileKey,
        });
        return await getSignedUrl(this.s3Client, command, { expiresIn: expirySeconds });
      } catch (err) {
        this.logger.error('Failed to generate S3 presigned URL', err);
        throw new InternalServerErrorException('Error generating secure download URL');
      }
    } else {
      // Return static local URL
      return `${this.apiBaseUrl}/uploads/${fileKey}`;
    }
  }

  /**
   * Verify signature token for local download URL
   */
  verifyLocalToken(fileKey: string, token: string): boolean {
    if (this.s3Client) return false;

    try {
      const parts = (token || '').split(':');
      const expiresStr = parts[0] || '';
      const signature = parts[1] || '';

      if (!expiresStr || !signature) {
        return false;
      }

      const expires = parseInt(expiresStr, 10);
      if (isNaN(expires) || expires < Date.now() / 1000) {
        this.logger.warn(`Signature expired for key: ${fileKey}`);
        return false;
      }

      const expectedSignature = crypto
        .createHmac('sha256', this.signingSecret)
        .update(`${fileKey}:${expires}`)
        .digest('hex');

      const sigBuffer = Buffer.from(signature);
      const expectedSigBuffer = Buffer.from(expectedSignature);

      if (sigBuffer.length !== expectedSigBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(sigBuffer, expectedSigBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Retrieve file content as a Buffer for internal processing
   */
  async getFileBuffer(fileKey: string): Promise<{ data: Buffer; mimetype: string }> {
    if (this.s3Client) {
      try {
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: fileKey,
        });
        const response = await this.s3Client.send(command);
        const data = await response.Body?.transformToByteArray();
        if (!data) {
          throw new Error('S3 body is empty');
        }
        return {
          data: Buffer.from(data),
          mimetype: response.ContentType || 'application/octet-stream',
        };
      } catch (err) {
        this.logger.error(`Failed to read file from S3: ${fileKey}`, err);
        throw new InternalServerErrorException('Error retrieving file from remote storage');
      }
    } else {
      try {
        const filePath = path.join(this.localDir, fileKey);
        if (!fs.existsSync(filePath)) {
          throw new BadRequestException('File not found');
        }
        const data = await fs.promises.readFile(filePath);
        // Deduce mime-type from extension
        const ext = path.extname(filePath).toLowerCase();
        let mimetype = 'application/octet-stream';
        if (ext === '.pdf') mimetype = 'application/pdf';
        else if (ext === '.docx')
          mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (ext === '.doc') mimetype = 'application/msword';

        return { data, mimetype };
      } catch (err) {
        if (err instanceof BadRequestException) throw err;
        this.logger.error(`Failed to read file from disk: ${fileKey}`, err);
        throw new InternalServerErrorException('Error reading file locally');
      }
    }
  }
}
