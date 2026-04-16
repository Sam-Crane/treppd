import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { FeedbackDto } from './dto/feedback.dto';

// 20 messages per hour per IP — roughly one a day for casual use,
// or a focused session for an active user. Tightens far below the
// global 100/min throttle because chat hits Claude (cost + rate).
const CHAT_THROTTLE = { default: { limit: 20, ttl: 3_600_000 } };

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('history')
  getHistory(@CurrentUser() user: { userId: string }) {
    return this.chatService.getHistory(user.userId);
  }

  @Delete('history')
  clearHistory(@CurrentUser() user: { userId: string }) {
    return this.chatService.clearHistory(user.userId);
  }

  /** Non-streaming fallback. Returns full response after Claude completes. */
  @Throttle(CHAT_THROTTLE)
  @Post('message')
  sendMessage(
    @CurrentUser() user: { userId: string },
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(
      user.userId,
      dto.message,
      dto.context_type,
    );
  }

  /**
   * Streaming chat via Server-Sent Events. The frontend opens a fetch
   * connection, parses `data:` frames, and updates the UI token-by-token.
   *
   * We pipe the raw SSE body from the FastAPI service straight to the
   * client without re-encoding — preserves the wire format defined in
   * apps/api-python/services/claude_rag.py to_sse().
   */
  @Throttle(CHAT_THROTTLE)
  @Post('stream')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache, no-transform')
  @Header('Connection', 'keep-alive')
  @Header('X-Accel-Buffering', 'no')
  async streamMessage(
    @CurrentUser() user: { userId: string },
    @Body() dto: SendMessageDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const upstream = await this.chatService.streamMessage(
      user.userId,
      dto.message,
      dto.context_type,
    );

    // Abort upstream read if the client disconnects mid-stream
    const reader = upstream.getReader();
    const abort = () => {
      reader.cancel().catch(() => {
        /* no-op */
      });
    };
    req.on('close', abort);

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        // value is Uint8Array of an already-formatted SSE frame
        res.write(value);
      }
    } catch {
      // Best-effort: emit an error event so the client doesn't hang
      res.write(
        `data: ${JSON.stringify({ type: 'error', message: 'Stream interrupted' })}\n\n`,
      );
    } finally {
      req.off('close', abort);
      res.end();
    }
  }

  @Post('feedback')
  submitFeedback(
    @CurrentUser() user: { userId: string },
    @Body() dto: FeedbackDto,
  ) {
    return this.chatService.submitFeedback(
      user.userId,
      dto.log_id,
      dto.rating,
      dto.comment,
    );
  }
}
