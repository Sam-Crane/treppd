import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { DocumentsService } from './documents.service';
import {
  FinalizeUploadDto,
  UploadUrlRequestDto,
} from './dto/upload.dto';

// Capping uploads per user per hour prevents accidental pathological loops
// from client code. Storage bucket also limits to 10 MB per file server-side.
const UPLOAD_THROTTLE = { default: { limit: 40, ttl: 3_600_000 } };

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // --- Read -------------------------------------------------------------

  @Get('checklist')
  getChecklist(@CurrentUser() user: { userId: string }) {
    return this.documentsService.getChecklist(user.userId);
  }

  @Get('checklist/:step_slug')
  getChecklistByStep(
    @CurrentUser() user: { userId: string },
    @Param('step_slug') stepSlug: string,
  ) {
    return this.documentsService.getChecklistByStep(user.userId, stepSlug);
  }

  @Get()
  listDocuments(@CurrentUser() user: { userId: string }) {
    return this.documentsService.listDocuments(user.userId);
  }

  @Get(':id/download-url')
  getDownloadUrl(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.documentsService.getSignedReadUrl(user.userId, id);
  }

  // --- Write ------------------------------------------------------------

  /**
   * Step 1 of 2: returns a short-lived signed URL the browser uses to PUT
   * the file bytes directly to Supabase Storage (bypassing NestJS).
   */
  @Throttle(UPLOAD_THROTTLE)
  @Post('upload-url')
  createUploadUrl(
    @CurrentUser() user: { userId: string },
    @Body() dto: UploadUrlRequestDto,
  ) {
    return this.documentsService.createUploadUrl(user.userId, dto);
  }

  /**
   * Step 2 of 2: persist metadata once the upload has succeeded.
   */
  @Throttle(UPLOAD_THROTTLE)
  @Post('finalize')
  finalizeUpload(
    @CurrentUser() user: { userId: string },
    @Body() dto: FinalizeUploadDto,
  ) {
    return this.documentsService.finalizeUpload(user.userId, dto);
  }

  @Delete(':id')
  deleteDocument(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.documentsService.deleteDocument(user.userId, id);
  }
}
