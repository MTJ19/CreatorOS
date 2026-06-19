import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { InstagramController } from './instagram.controller';
import { InstagramService } from './instagram.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [InstagramController],
  providers: [InstagramService],
  exports: [InstagramService],
})
export class InstagramModule {}
