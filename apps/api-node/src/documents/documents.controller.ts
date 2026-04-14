import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { DocumentsService } from './documents.service';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

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
}
