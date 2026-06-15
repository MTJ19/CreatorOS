import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreateInvoiceDto, UpdateInvoiceDto, MarkPaidDto } from './invoices.dto';
import { InvoicesService } from './invoices.service';

import type { JwtPayload } from '../auth/strategies/jwt.strategy';


@ApiTags('invoices')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'List all invoices for the authenticated creator' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.invoicesService.findAll(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single invoice by ID' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.invoicesService.findOne(id, user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new invoice' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an invoice' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an invoice' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.invoicesService.remove(id, user.sub);
  }

  @Patch(':id/mark-paid')
  @ApiOperation({ summary: 'Mark an invoice as paid (or partially paid)' })
  markPaid(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: MarkPaidDto,
  ) {
    return this.invoicesService.markPaid(id, user.sub, dto);
  }
}
