import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { InvisibleTaxService } from './invisible-tax.service';

import type { JwtPayload } from '../auth/strategies/jwt.strategy';


@ApiTags('invisible-tax')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('invisible-tax')
export class InvisibleTaxController {
  constructor(private readonly invisibleTaxService: InvisibleTaxService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get invisible tax summary for the authenticated creator' })
  getSummary(@CurrentUser() user: JwtPayload) {
    return this.invisibleTaxService.getSummary(user.sub);
  }
}
