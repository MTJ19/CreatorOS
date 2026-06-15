import {
  Controller,
  Get,
  Query,
  Res,
  UnauthorizedException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';

import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(private readonly storageService: StorageService) {}

  @Get('download')
  async downloadFile(
    @Query('key') key: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    if (!key || !token) {
      throw new UnauthorizedException('Missing key or signature token');
    }

    const isValid = this.storageService.verifyLocalToken(key, token);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired download signature');
    }

    try {
      const { data, mimetype } = await this.storageService.getFileBuffer(key);
      res.setHeader('Content-Type', mimetype);
      // Inline display for PDFs, attachments for Word docs
      const disposition = mimetype === 'application/pdf' ? 'inline' : 'attachment';
      res.setHeader(
        'Content-Disposition',
        `${disposition}; filename="${encodeURIComponent(key.split('/').pop() || 'file')}"`,
      );
      res.send(data);
    } catch (err: any) {
      this.logger.error(`Failed to serve download for key: ${key}`, err);
      if (err && err.message === 'File not found') {
        throw new NotFoundException('Requested file not found');
      }
      throw err;
    }
  }
}
