import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { AdminService } from './admin.service';
import { UpsertContentDto } from './dto/upsert-content.dto';
import { IngestDto } from './dto/ingest.dto';
import { LogoUploadDto } from './dto/logo-upload.dto';

/**
 * Admin content management + RAG ingestion.
 *
 * The class only requires a valid JWT; the admin-role check (AdminGuard) is
 * applied per-route so `whoami` can answer for ANY authenticated user (the UI
 * uses it to decide whether to show the Admin nav). All mutating/content
 * routes additionally require AdminGuard.
 *
 * `:resource` is a fixed slug (offices, roadmap-steps, requirement-tags, ...)
 * mapped to a table inside AdminService — clients cannot target arbitrary
 * tables.
 */
@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** Lightweight role check for any authenticated user (no AdminGuard). */
  @Get('whoami')
  whoami(@CurrentUser() user: { userId: string }) {
    return this.adminService.whoami(user.userId);
  }

  @Get('content/:resource')
  @UseGuards(AdminGuard)
  list(@Param('resource') resource: string) {
    return this.adminService.list(resource);
  }

  @Post('content/:resource')
  @UseGuards(AdminGuard)
  upsert(@Param('resource') resource: string, @Body() dto: UpsertContentDto) {
    return this.adminService.upsert(resource, dto.row);
  }

  @Delete('content/:resource/:id')
  @UseGuards(AdminGuard)
  remove(@Param('resource') resource: string, @Param('id') id: string) {
    return this.adminService.remove(resource, id);
  }

  /** Trigger a RAG ingestion run (synchronous; can take a while). */
  @Post('ingest')
  @UseGuards(AdminGuard)
  ingest(@Body() dto: IngestDto) {
    return this.adminService.ingest(dto);
  }

  /** Signed URL to upload a provider logo to the public-assets bucket. */
  @Post('providers/logo-upload-url')
  @UseGuards(AdminGuard)
  logoUploadUrl(@Body() dto: LogoUploadDto) {
    return this.adminService.createLogoUploadUrl(dto.mime_type);
  }
}
