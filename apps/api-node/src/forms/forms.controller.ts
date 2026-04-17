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
import { FormsService } from './forms.service';
import { SaveSessionDto } from './dto/save-session.dto';

// Explain-field is cached per (form, field, visa, bundesland) for 60 min on
// the Python side, so the user-facing throttle can be generous — 30 per hour
// per IP is more than enough for a normal form session yet still a ceiling
// on spam.
const EXPLAIN_THROTTLE = { default: { limit: 30, ttl: 3_600_000 } };

@ApiTags('forms')
@ApiBearerAuth()
@Controller('forms')
@UseGuards(JwtAuthGuard)
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  /** List forms applicable to the user's profile (no fields payload). */
  @Get()
  listForms(@CurrentUser() user: { userId: string }) {
    return this.formsService.listForUser(user.userId);
  }

  /** Full form including field definitions. */
  @Get(':form_code')
  getForm(
    @CurrentUser() user: { userId: string },
    @Param('form_code') formCode: string,
  ) {
    return this.formsService.getByCode(user.userId, formCode);
  }

  /** AI-powered per-field explanation, personalised to the user's profile. */
  @Throttle(EXPLAIN_THROTTLE)
  @Get(':form_code/explain/:field_id')
  explainField(
    @CurrentUser() user: { userId: string },
    @Param('form_code') formCode: string,
    @Param('field_id') fieldId: string,
  ) {
    return this.formsService.explainField(user.userId, formCode, fieldId);
  }

  /** Retrieve the user's saved progress on this form. */
  @Get(':form_code/session')
  getSession(
    @CurrentUser() user: { userId: string },
    @Param('form_code') formCode: string,
  ) {
    return this.formsService.getSession(user.userId, formCode);
  }

  /** Auto-save progress. Called debounced from the frontend. */
  @Post(':form_code/session')
  saveSession(
    @CurrentUser() user: { userId: string },
    @Param('form_code') formCode: string,
    @Body() dto: SaveSessionDto,
  ) {
    return this.formsService.saveSession(user.userId, formCode, dto.values);
  }

  /** Reset button / user-initiated clear. */
  @Delete(':form_code/session')
  clearSession(
    @CurrentUser() user: { userId: string },
    @Param('form_code') formCode: string,
  ) {
    return this.formsService.clearSession(user.userId, formCode);
  }
}
